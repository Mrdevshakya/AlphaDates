import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  RefreshControl,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons, Feather, AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { createOrGetChatRoom } from '../utils/chat';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../../src/types';
import { createNotification } from '../utils/notifications';
import usePresence from '../hooks/usePresence';
import SubscriptionPlans from '../components/SubscriptionPlans';
import { SubscriptionService } from '../utils/subscription';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 30;
const CARD_HEIGHT = height * 0.6;
const SWIPE_THRESHOLD = 120;

// Separate component for matched user to properly use hooks
const MatchedUserItem = ({ user, onMessage }: { user: MatchedUser; onMessage: (userId: string) => void }) => {
  const isOnline = usePresence(user.id);
  
  return (
    <TouchableOpacity
      style={styles.matchedUserCard}
      onPress={() => onMessage(user.id)}
    >
      <ImageBackground
        source={
          user.photos?.[0]
            ? { uri: user.photos[0] }
            : require('../../assets/images/default-avatar.svg')
        }
        style={styles.matchedUserImage}
        imageStyle={styles.matchedUserImageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.matchedUserGradient}
        >
          <View style={styles.matchedUserInfo}>
            <View style={styles.matchedUserNameRow}>
              <Text style={styles.matchedUserName}>
                {user.name}
              </Text>
              {isOnline && <View style={styles.onlineIndicator} />}
              {user.matchSource === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>★</Text>
                </View>
              )}
            </View>
            <Text style={styles.matchedUserBio} numberOfLines={2}>
              {user.bio || 'No bio yet'}
            </Text>
            {user.matchSource === 'admin' && (
              <Text style={styles.adminMatchText}>Recommended by AlphaDate</Text>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
      <TouchableOpacity
        style={styles.messageButton}
        onPress={() => onMessage(user.id)}
      >
        <Ionicons name="chatbubble" size={20} color="#FFF" />
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

interface Match {
  id: string;
  users: string[];
  createdAt: any;
  lastInteraction?: any;
  isMatched: boolean;
}

interface MatchedUser extends UserProfile {
  isOnline: boolean;
  matchSource?: 'user' | 'admin';
}

export default function MatchesScreen() {
  const { user, hasActiveSubscription, refreshSubscription, subscription } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Debug subscription status
  useEffect(() => {
    console.log('🎯 Matches Screen - User:', user?.uid);
    console.log('🎯 Matches Screen - Has Active Subscription:', hasActiveSubscription);
    console.log('🎯 Matches Screen - Subscription object:', subscription);
    console.log('🎯 Matches Screen - typeof hasActiveSubscription:', typeof hasActiveSubscription);
  }, [user, hasActiveSubscription, subscription]);

  // Direct subscription check to bypass AuthContext issues
  useEffect(() => {
    const directSubscriptionCheck = async () => {
      if (!user?.uid) {
        setSubscriptionLoading(false);
        return;
      }
      
      console.log('🔍 Direct subscription check for user:', user.uid);
      setSubscriptionLoading(true);
      
      try {
        const directSubscription = await SubscriptionService.getUserSubscription(user.uid);
        const directIsActive = await SubscriptionService.hasActiveSubscription(user.uid);
        
        console.log('📊 Direct check - Subscription:', directSubscription);
        console.log('✅ Direct check - Is Active:', directIsActive);
        console.log('🔄 AuthContext hasActiveSubscription:', hasActiveSubscription);
        
        if (directIsActive !== hasActiveSubscription) {
          console.log('⚠️ MISMATCH DETECTED! Direct check:', directIsActive, 'AuthContext:', hasActiveSubscription);
          console.log('🔄 Triggering AuthContext refresh...');
          await refreshSubscription();
        }
      } catch (error) {
        console.error('❌ Direct subscription check error:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    directSubscriptionCheck();
  }, [user?.uid]);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [potentialMatches, setPotentialMatches] = useState<UserProfile[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'matches'>('discover');
  const swipeAnim = useRef(new Animated.ValueXY()).current;
  const rotateAnim = swipeAnim.x.interpolate({
    inputRange: [-width/2, 0, width/2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });
  const likeOpacity = swipeAnim.x.interpolate({
    inputRange: [0, width/4],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  const nopeOpacity = swipeAnim.x.interpolate({
    inputRange: [-width/4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, { dx, dy }) => {
      swipeAnim.setValue({ x: dx, y: dy });
    },
    onPanResponderRelease: (_, { dx, dy }) => {
      const direction = Math.sign(dx);
      const isActionActive = Math.abs(dx) > SWIPE_THRESHOLD;

      if (isActionActive) {
        Animated.timing(swipeAnim, {
          toValue: { x: direction * width * 1.5, y: dy },
          duration: 300,
          useNativeDriver: true
        }).start(() => {
          handleSwipe(direction === 1);
          setCurrentIndex(prevIndex => prevIndex + 1);
          swipeAnim.setValue({ x: 0, y: 0 });
        });
      } else {
        Animated.spring(swipeAnim, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: true
        }).start();
      }
    }
  });

  const handleSwipe = async (isLike: boolean) => {
    if (!user || currentIndex >= potentialMatches.length) return;

    // Check if user has active subscription
    if (!hasActiveSubscription) {
      setShowSubscriptionModal(true);
      return;
    }

    const targetUser = potentialMatches[currentIndex];
    
    try {
      // Create or update match document
      const matchesRef = collection(db, 'matches');
      const matchQuery = query(
        matchesRef,
        where('users', 'array-contains', user.uid)
      );
      const matchSnapshot = await getDocs(matchQuery);
      let existingMatch = matchSnapshot.docs.find(doc => 
        doc.data().users.includes(targetUser.id)
      );

      if (existingMatch) {
        // Update existing match
        if (isLike) {
          await updateDoc(doc(db, 'matches', existingMatch.id), {
            isMatched: true,
            lastInteraction: serverTimestamp()
          });

          // If both users liked each other, it's a match!
          if (existingMatch.data().isMatched) {
            // Create match notification for both users
            try {
              // Notify the target user
              await createNotification(
                'match',
                user.uid,
                targetUser.id
              );
              
              // Notify the current user
              await createNotification(
                'match',
                targetUser.id,
                user.uid
              );
            } catch (error) {
              console.error('Error creating match notification:', error);
            }
            
            Alert.alert(
              "It's a Match! 🎉",
              `You and ${targetUser.displayName} liked each other!`,
              [
                { 
                  text: "Send Message", 
                  onPress: () => handleMessage(targetUser.id)
                },
                { text: "Keep Browsing" }
              ]
            );
          }
        }
      } else {
        // Create new match
        await addDoc(matchesRef, {
          users: [user.uid, targetUser.id],
          createdAt: serverTimestamp(),
          lastInteraction: serverTimestamp(),
          isMatched: isLike
        });
      }
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  };

  const fetchMatches = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching matches for user:', user.uid);
      
      // Get current user's profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.error('Current user profile not found');
        Alert.alert('Error', 'Failed to load user profile');
        return;
      }
      
      const currentUserProfile = userDoc.data() as UserProfile;
      console.log('Current user profile:', currentUserProfile);

      // Get all potential matches (excluding current user)
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const [matchesSnapshot, adminMatchesSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'matches'),
          where('users', 'array-contains', user.uid)
        )),
        // Get admin-created matches
        getDocs(query(
          collection(db, 'adminMatches'),
          where('users', 'array-contains', user.uid)
        ))
      ]);

      // Filter out current user on client side
      const filteredUsersSnapshot = {
        ...usersSnapshot,
        docs: usersSnapshot.docs.filter(doc => doc.id !== user.uid)
      };

      console.log('Found potential matches:', filteredUsersSnapshot.size);
      console.log('Found existing matches:', matchesSnapshot.size);
      console.log('Found admin matches:', adminMatchesSnapshot.size);

      // Get existing matches (both user-created and admin-created)
      const existingMatches = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'user'
      })) as (Match & { source: string })[];

      // Get admin matches and convert them to regular matches format
      const adminMatches = adminMatchesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          users: data.users,
          createdAt: data.createdAt,
          lastInteraction: data.createdAt,
          isMatched: true, // Admin matches are automatically matched
          source: 'admin'
        };
      }) as (Match & { source: string })[];

      const allMatches = [...existingMatches, ...adminMatches];
      setMatches(allMatches);

      // Filter out users that are already matched
      const matchedUserIds = allMatches
        .filter(match => match.isMatched)
        .flatMap(match => match.users)
        .filter(id => id !== user.uid);

      console.log('Already matched users:', matchedUserIds);

      // Filter users client-side based on preferences and opposite gender
      const users: UserProfile[] = [];
      filteredUsersSnapshot.docs.forEach((doc) => {
        const userData = doc.data() as UserProfile;
        // Make sure the user document has an id field
        userData.id = doc.id;
        
        // Check if user is already matched
        if (matchedUserIds.includes(userData.id)) {
          return; // Skip already matched users
        }
        
        // Gender preference filtering - show opposite gender only
        // If current user is male, show female profiles and vice versa
        const isOppositeGender = currentUserProfile.gender === 'male' ? 
          userData.gender === 'female' : 
          currentUserProfile.gender === 'female' ? 
          userData.gender === 'male' : 
          true; // If user is other, show all genders
        
        // Additional preference filtering
        const matchesPreferences = (!currentUserProfile.lookingFor ||
          !userData.lookingFor ||
          currentUserProfile.lookingFor === 'any' ||
          userData.lookingFor === 'any' ||
          currentUserProfile.lookingFor === userData.lookingFor);
        
        if (isOppositeGender && matchesPreferences) {
          users.push(userData);
        }
      });

      console.log('Filtered matches count:', users.length);
      setPotentialMatches(users);
    } catch (error) {
      console.error('Error fetching matches:', error);
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchedUsers = async () => {
    if (!user) return;
    console.log('Fetching matched users for user:', user.uid);
    try {
      const matchedUsersData: MatchedUser[] = [];
      // Use a Set to track user IDs to prevent duplicates
      const userIds = new Set<string>();
      
      // Get all user matches where isMatched is true
      const matchesRef = collection(db, 'matches');
      const matchesQuery = query(
        matchesRef,
        where('users', 'array-contains', user.uid),
        where('isMatched', '==', true)
      );
      
      // Get all admin matches (admin matches are automatically matched)
      const adminMatchesRef = collection(db, 'adminMatches');
      const adminMatchesQuery = query(
        adminMatchesRef,
        where('users', 'array-contains', user.uid)
      );
      
      const [matchesSnapshot, adminMatchesSnapshot] = await Promise.all([
        getDocs(matchesQuery),
        getDocs(adminMatchesQuery)
      ]);
      
      console.log('Found matched users:', matchesSnapshot.size);
      console.log('Found admin matches:', adminMatchesSnapshot.size);
      
      // Process user matches
      for (const matchDoc of matchesSnapshot.docs) {
        const matchData = matchDoc.data();
        console.log('Processing user match:', matchDoc.id, matchData);
        const otherUserId = matchData.users.find((id: string) => id !== user.uid);
        
        if (otherUserId && !userIds.has(otherUserId)) {
          userIds.add(otherUserId);
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            console.log('Found matched user:', userDoc.id, userData);
            matchedUsersData.push({
              ...userData,
              id: userDoc.id,
              isOnline: false, // Will be updated by usePresence hook
              matchSource: 'user'
            });
          } else {
            console.log('User document not found for ID:', otherUserId);
          }
        }
      }
      
      // Process admin matches
      for (const matchDoc of adminMatchesSnapshot.docs) {
        const matchData = matchDoc.data();
        console.log('Processing admin match:', matchDoc.id, matchData);
        const otherUserId = matchData.users.find((id: string) => id !== user.uid);
        
        if (otherUserId && !userIds.has(otherUserId)) {
          userIds.add(otherUserId);
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            console.log('Found admin matched user:', userDoc.id, userData);
            matchedUsersData.push({
              ...userData,
              id: userDoc.id,
              isOnline: false, // Will be updated by usePresence hook
              matchSource: 'admin'
            });
          } else {
            console.log('User document not found for ID:', otherUserId);
          }
        }
      }
      
      console.log('Matched users data:', matchedUsersData);
      setMatchedUsers(matchedUsersData);
    } catch (error) {
      console.error('Error fetching matched users:', error);
      Alert.alert('Error', 'Failed to load matches');
    }
  };

  // Add debug effect
  useEffect(() => {
    console.log('Current matches state:', potentialMatches);
  }, [potentialMatches]);

  useEffect(() => {
    fetchMatches();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'matches') {
      fetchMatchedUsers();
    }
  }, [activeTab, user]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'discover') {
      fetchMatches().finally(() => setRefreshing(false));
    } else {
      fetchMatchedUsers().finally(() => setRefreshing(false));
    }
  }, [activeTab]);

  const handleMessage = async (userId: string) => {
    if (!user) return;
    try {
      if (userId === user.uid) return;
      
      const chatRoomId = await createOrGetChatRoom(user.uid, userId);
      router.push(`/chats/chat/${chatRoomId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to start chat. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderMatchCard = (userProfile: UserProfile) => {
    console.log('Rendering profile:', userProfile);

    const renderImage = () => {
      if (userProfile.profilePicture) {
        return (
          <ImageBackground
            source={{ uri: userProfile.profilePicture }}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}
          >
            {renderContent()}
          </ImageBackground>
        );
      } else {
        return (
          <View style={[styles.cardBackground, { backgroundColor: '#f0f0f0' }]}>
            <View style={styles.defaultAvatar}>
              <MaterialCommunityIcons name="account" size={100} color="#999" />
            </View>
            {renderContent()}
          </View>
        );
      }
    };

    const renderContent = () => (
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
        style={styles.cardContent}
      >
        <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
          <Text style={styles.stampText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.nopeStamp, { opacity: nopeOpacity }]}>
          <Text style={styles.stampText}>NOPE</Text>
        </Animated.View>

        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userProfile.displayName || userProfile.name || 'Anonymous'}{userProfile.age ? `, ${userProfile.age}` : ''}
            </Text>
            <Text style={styles.userBio}>{userProfile.bio || 'No bio yet'}</Text>
          </View>
        </View>

        <View style={styles.userDetails}>
          {userProfile.work && (
            <View style={styles.detailItem}>
              <Feather name="briefcase" size={16} color="#FFF" />
              <Text style={styles.detailText}>{userProfile.work}</Text>
            </View>
          )}
          {userProfile.education && (
            <View style={styles.detailItem}>
              <Feather name="book" size={16} color="#FFF" />
              <Text style={styles.detailText}>{userProfile.education}</Text>
            </View>
          )}
          {userProfile.location && (
            <View style={styles.detailItem}>
              <Feather name="map-pin" size={16} color="#FFF" />
              <Text style={styles.detailText}>
                {typeof userProfile.location === 'string'
                  ? userProfile.location
                  : typeof userProfile.location === 'object' && userProfile.location._lat && userProfile.location._long
                    ? `${userProfile.location._lat.toFixed(4)}, ${userProfile.location._long.toFixed(4)}`
                    : 'Location available'
                }
              </Text>
            </View>
          )}
        </View>

        {userProfile.interests && userProfile.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            {userProfile.interests.map((interest, idx) => (
              <View key={idx} style={styles.interestBadge}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.nopeButton]}
            onPress={() => handleSwipe(false)}
          >
            <AntDesign name="close" size={30} color="#FF4B6F" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleSwipe(true)}
          >
            <AntDesign name="heart" size={30} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX: swipeAnim.x },
              { translateY: swipeAnim.y },
              { rotate: rotateAnim }
            ]
          }
        ]}
      >
        {renderImage()}
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="cards-heart-outline" size={64} color="#999" />
      <Text style={styles.emptyText}>No more profiles to show</Text>
      <Text style={styles.emptySubtext}>Try again later</Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMatchedUsers = () => {
    if (matchedUsers.length === 0) {
      return (
        <View style={styles.emptyMatchesContainer}>
          <MaterialCommunityIcons name="heart-multiple" size={64} color="#FF4B6A" />
          <Text style={styles.emptyMatchesText}>No matches yet</Text>
          <Text style={styles.emptyMatchesSubtext}>Start swiping to find your matches!</Text>
          <TouchableOpacity 
            style={styles.startMatchingButton}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={styles.startMatchingButtonText}>Start Matching</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.matchedUsersContainer}
        contentContainerStyle={styles.matchedUsersContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {matchedUsers.map((matchedUser) => (
          <MatchedUserItem 
            key={`${matchedUser.id}-${matchedUser.matchSource || 'user'}`} 
            user={matchedUser} 
            onMessage={handleMessage} 
          />
        ))}
      </ScrollView>
    );
  };

  const renderSubscriptionRequired = () => (
    <View style={styles.subscriptionRequiredContainer}>
      <MaterialCommunityIcons name="crown" size={80} color="#FFD700" />
      <Text style={styles.subscriptionRequiredTitle}>🔒 Premium Feature</Text>
      <Text style={styles.subscriptionRequiredText}>
        Matches feature requires an active subscription to use. Without subscription, you cannot swipe or view potential matches.
      </Text>
      <View style={styles.subscriptionStatusBadge}>
        <Text style={styles.subscriptionStatusText}>❌ No Active Subscription</Text>
      </View>
      
      
      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={() => setShowSubscriptionModal(true)}
      >
        <LinearGradient
          colors={['#FF4B6A', '#FF6B8A']}
          style={styles.subscribeButtonGradient}
        >
          <Text style={styles.subscribeButtonText}>Get Premium</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
              Discover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
            onPress={() => setActiveTab('matches')}
          >
            <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>
              Matches
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading || subscriptionLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4B6A" />
          <Text style={styles.loadingText}>
            {subscriptionLoading ? 'Checking subscription...' : 'Loading...'}
          </Text>
        </View>
      ) : !hasActiveSubscription ? (
        <>
          {console.log('🚫 RENDERING SUBSCRIPTION REQUIRED SCREEN - hasActiveSubscription:', hasActiveSubscription)}
          {renderSubscriptionRequired()}
        </>
      ) : (
        <>
          {console.log('✅ USER HAS SUBSCRIPTION - SHOWING MATCHES - hasActiveSubscription:', hasActiveSubscription)}
          {activeTab === 'discover' ? (
            <View style={styles.cardsContainer}>
              {currentIndex < potentialMatches.length ? (
                renderMatchCard(potentialMatches[currentIndex])
              ) : (
                renderEmptyState()
              )}
            </View>
          ) : (
            renderMatchedUsers()
          )}
        </>
      )}

      {/* Subscription Modal */}
      <SubscriptionPlans
        userId={user?.uid || ''}
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={async () => {
          // Refresh subscription status
          await refreshSubscription();
          setShowSubscriptionModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#FF4B6A',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFF',
  },
  matchedUsersContainer: {
    flex: 1,
  },
  matchedUsersContent: {
    padding: 15,
  },
  matchedUserCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  matchedUserImage: {
    height: 200,
    justifyContent: 'flex-end',
  },
  matchedUserImageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  matchedUserGradient: {
    padding: 15,
  },
  matchedUserInfo: {
    justifyContent: 'flex-end',
  },
  matchedUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchedUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  matchedUserBio: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4B6A',
    padding: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  messageButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyMatchesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyMatchesText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
  },
  emptyMatchesSubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  startMatchingButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  startMatchingButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    marginTop: 12,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: 'absolute',
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImage: {
    borderRadius: 20,
  },
  cardContent: {
    padding: 20,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userBio: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 8,
  },
  userDetails: {
    marginTop: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  interestBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#FFF',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    backgroundColor: '#FFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nopeButton: {
    backgroundColor: '#FFF',
  },
  likeButton: {
    backgroundColor: '#FFF',
  },
  likeStamp: {
    position: 'absolute',
    top: '40%',
    right: 40,
    transform: [{ rotate: '30deg' }],
    borderWidth: 4,
    borderColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  nopeStamp: {
    position: 'absolute',
    top: '40%',
    left: 40,
    transform: [{ rotate: '-30deg' }],
    borderWidth: 4,
    borderColor: '#FF4B6F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stampText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 5,
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: '#FF4B6F',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultAvatar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  subscriptionRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 10,
  },
  subscriptionRequiredText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  subscribeButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  subscribeButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subscriptionStatusBadge: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  subscriptionStatusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  adminBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  adminMatchText: {
    fontSize: 12,
    color: '#FFD700',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
