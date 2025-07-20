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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../../src/types';
import { createNotification } from '../utils/notifications';
import usePresence from '../hooks/usePresence';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 30;
const CARD_HEIGHT = height * 0.6;
const SWIPE_THRESHOLD = 120;

interface Match {
  id: string;
  users: string[];
  createdAt: any;
  lastInteraction?: any;
  isMatched: boolean;
}

interface MatchedUser extends UserProfile {
  isOnline: boolean;
}

export default function MatchesScreen() {
  const { user } = useAuth();
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

      // Get all potential matches
      const usersRef = collection(db, 'users');
      const usersQuery = query(
        usersRef,
        where('id', '!=', user.uid)
      );
      
      const [usersSnapshot, matchesSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(query(
          collection(db, 'matches'),
          where('users', 'array-contains', user.uid)
        ))
      ]);

      console.log('Found potential matches:', usersSnapshot.size);
      console.log('Found existing matches:', matchesSnapshot.size);

      // Get existing matches
      const existingMatches = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];
      setMatches(existingMatches);

      // Filter out users that are already matched
      const matchedUserIds = existingMatches
        .filter(match => match.isMatched)
        .flatMap(match => match.users)
        .filter(id => id !== user.uid);

      console.log('Already matched users:', matchedUserIds);

      // Filter users client-side based on preferences
      const users: UserProfile[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as UserProfile;
        // Make sure the user document has an id field
        userData.id = doc.id;
        
        if (!matchedUserIds.includes(userData.id) && 
            (!currentUserProfile.lookingFor || 
             !userData.lookingFor || 
             currentUserProfile.lookingFor === 'any' || 
             userData.lookingFor === 'any' ||
             currentUserProfile.lookingFor === userData.lookingFor)) {
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
    try {
      const matchedUsersData: MatchedUser[] = [];
      
      // Get all matches where isMatched is true
      const matchesRef = collection(db, 'matches');
      const matchesQuery = query(
        matchesRef,
        where('users', 'array-contains', user.uid),
        where('isMatched', '==', true)
      );
      
      const matchesSnapshot = await getDocs(matchesQuery);
      
      for (const matchDoc of matchesSnapshot.docs) {
        const matchData = matchDoc.data();
        const otherUserId = matchData.users.find((id: string) => id !== user.uid);
        
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            matchedUsersData.push({
              ...userData,
              id: userDoc.id,
              isOnline: false // Will be updated by usePresence hook
            });
          }
        }
      }
      
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
  }, [activeTab]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMatches().finally(() => setRefreshing(false));
  }, []);

  const handleMessage = async (userId: string) => {
    if (!user) return;
    try {
      if (userId === user.uid) return;
      
      const chatRoomId = await createOrGetChatRoom(user.uid, userId);
      router.push({
        pathname: '/chat/[id]',
        params: { id: chatRoomId }
      });
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
            <SvgUri
              width="100%"
              height="100%"
              uri={require('../../assets/images/default-avatar.svg')}
              style={styles.defaultAvatar}
            />
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
              <Text style={styles.detailText}>{userProfile.location}</Text>
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
            onRefresh={() => {
              setRefreshing(true);
              fetchMatchedUsers().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        {matchedUsers.map((matchedUser) => {
          const isOnline = usePresence(matchedUser.id);
          return (
            <TouchableOpacity
              key={matchedUser.id}
              style={styles.matchedUserCard}
              onPress={() => handleMessage(matchedUser.id)}
            >
              <ImageBackground
                source={
                  matchedUser.photos?.[0]
                    ? { uri: matchedUser.photos[0] }
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
                        {matchedUser.name}
                      </Text>
                      {isOnline && <View style={styles.onlineIndicator} />}
                    </View>
                    <Text style={styles.matchedUserBio} numberOfLines={2}>
                      {matchedUser.bio || 'No bio yet'}
                    </Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => handleMessage(matchedUser.id)}
              >
                <Ionicons name="chatbubble" size={20} color="#FFF" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4B6A" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : activeTab === 'discover' ? (
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
  },
});
