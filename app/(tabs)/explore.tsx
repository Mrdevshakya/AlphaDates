import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  FlatList,
  Platform,
  Animated,
  ImageBackground,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { createOrGetChatRoom } from '../utils/chat';
import { useAuth } from '../context/AuthContext';
import { collection, query as firebaseQuery, where, getDocs, orderBy, limit, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../../src/types';
import UserProfileModal from '../components/UserProfileModal';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.45;

// Mock data for demonstration
const USERS = [
  {
    id: '1',
    name: 'Sarah',
    age: 24,
    image: 'https://picsum.photos/800/1200?random=1',
    distance: '3 miles away',
    interests: ['Travel', 'Photography', 'Music', 'Art'],
    lastActive: '2 mins ago',
    bio: 'Adventure seeker & coffee lover ☕️',
    compatibility: '95%',
    occupation: 'Photographer',
    location: 'New York City',
  },
  {
    id: '2',
    name: 'Emily',
    age: 26,
    image: 'https://picsum.photos/800/1200?random=2',
    distance: '5 miles away',
    interests: ['Art', 'Yoga', 'Reading', 'Travel'],
    lastActive: 'Online',
    bio: 'Life is art, be creative 🎨',
    compatibility: '88%',
    occupation: 'Yoga Instructor',
    location: 'Brooklyn',
  },
  {
    id: '3',
    name: 'Jessica',
    age: 25,
    image: 'https://picsum.photos/800/1200?random=3',
    distance: '2 miles away',
    interests: ['Music', 'Dance', 'Travel', 'Food'],
    lastActive: '1 hour ago',
    bio: 'Dancing through life 💃',
    compatibility: '92%',
    occupation: 'Dance Teacher',
    location: 'Manhattan',
  },
];

const INTERESTS = [
  { id: '1', name: 'Travel', icon: 'map-pin' },
  { id: '2', name: 'Photography', icon: 'camera' },
  { id: '3', name: 'Music', icon: 'music' },
  { id: '4', name: 'Art', icon: 'palette' },
  { id: '5', name: 'Yoga', icon: 'heart' },
  { id: '6', name: 'Reading', icon: 'book-open' },
  { id: '7', name: 'Fitness', icon: 'activity' },
  { id: '8', name: 'Cooking', icon: 'coffee' },
  { id: '9', name: 'Dancing', icon: 'music' },
  { id: '10', name: 'Movies', icon: 'film' },
  { id: '11', name: 'Sports', icon: 'target' },
  { id: '12', name: 'Gaming', icon: 'gamepad' },
];

const CategoryChip = ({ label, isSelected, onPress, icon }: { label: string; isSelected: boolean; onPress: () => void; icon: string }) => (
  <TouchableOpacity
    style={[
      styles.categoryChip,
      isSelected && styles.categoryChipSelected
    ]}
    onPress={onPress}
  >
    <Ionicons 
      name={icon as any} 
      size={20} 
      color={isSelected ? '#FFF' : '#666'} 
      style={styles.categoryIcon}
    />
    <Text style={[
      styles.categoryChipText,
      isSelected && styles.categoryChipTextSelected
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function ExploreScreen() {
  const { user, userData, setUserData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Create refs for card animations
  const cardAnimations = useRef(
    USERS.map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(50)
    }))
  ).current;

  // Initialize animations on mount
  React.useEffect(() => {
    // Fade in screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Animate cards
    cardAnimations.forEach((animation, index) => {
      Animated.parallel([
        Animated.spring(animation.translateY, {
          toValue: 0,
          useNativeDriver: true,
          delay: index * 100,
        }),
        Animated.timing(animation.opacity, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const handlePressIn = useCallback((index: number) => {
    const { scale, opacity } = cardAnimations[index];
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressOut = useCallback((index: number) => {
    const { scale, opacity } = cardAnimations[index];
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleMessage = async (userId: string) => {
    if (!user) return;
    try {
      // Don't show message button for own profile
      if (userId === user.uid) {
        return;
      }
      
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

  // Search users function
  const searchUsers = async (searchText: string) => {
    if (!searchText.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const queryLower = searchText.toLowerCase();
      
      // Search by name or username
      const nameQuery = firebaseQuery(usersRef, 
        where('name', '>=', queryLower),
        where('name', '<=', queryLower + '\uf8ff'),
        limit(10)
      );
      
      const usernameQuery = firebaseQuery(usersRef,
        where('username', '>=', queryLower),
        where('username', '<=', queryLower + '\uf8ff'),
        limit(10)
      );

      const [nameSnapshot, usernameSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(usernameQuery)
      ]);

      const results = new Map<string, UserProfile>();

      // Add name results
      nameSnapshot.docs.forEach(doc => {
        if (doc.id !== user?.uid) { // Exclude current user
          results.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile);
        }
      });

      // Add username results
      usernameSnapshot.docs.forEach(doc => {
        if (doc.id !== user?.uid) { // Exclude current user
          results.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile);
        }
      });

      setUsers(Array.from(results.values()));
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  const debouncedSearch = useCallback(
    debounce((query: string) => searchUsers(query), 500),
    []
  );

  // Handle search input
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleFollowToggle = async (targetUserId: string, isFollowing: boolean) => {
    if (!user || !userData) {
      Alert.alert('Error', 'Please sign in to follow users');
      return;
    }

    if (followLoading) return;

    try {
      setFollowLoading(true);

      // Get references to both user documents
      const targetUserRef = doc(db, 'users', targetUserId);
      
      // Update target user's followers list
      await updateDoc(targetUserRef, {
        followers: isFollowing
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });

      // Update current user's following list
      const currentUserRef = doc(db, 'users', user.uid);
      await updateDoc(currentUserRef, {
        following: isFollowing 
          ? arrayRemove(targetUserId)
          : arrayUnion(targetUserId)
      });

      // Update local state
      const updatedUserData = {
        ...userData,
        following: isFollowing
          ? (userData.following || []).filter(id => id !== targetUserId)
          : [...(userData.following || []), targetUserId]
      };
      setUserData(updatedUserData);

      // Update the selected user if it's the one being followed/unfollowed
      if (selectedUser && selectedUser.id === targetUserId) {
        setSelectedUser({
          ...selectedUser,
          followers: isFollowing
            ? (selectedUser.followers || []).filter(id => id !== user.uid)
            : [...(selectedUser.followers || []), user.uid]
        });
      }

      // Update the users list
      setUsers(users.map(u => {
        if (u.id === targetUserId) {
          return {
            ...u,
            followers: isFollowing
              ? (u.followers || []).filter(id => id !== user.uid)
              : [...(u.followers || []), user.uid]
          };
        }
        return u;
      }));

    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert(
        'Error',
        'Failed to update follow status. Please try again.'
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUserPress = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const renderUserCard = ({ item: user }: { item: UserProfile }) => {
    const { scale, opacity, translateY } = cardAnimations[0];

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity,
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPressIn={() => handlePressIn(0)}
          onPressOut={() => handlePressOut(0)}
          onPress={() => handleUserPress(user)}
          style={styles.cardTouchable}
        >
          <ImageBackground
            source={{ 
              uri: user.profilePicture || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random` 
            }}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
              style={styles.cardContent}
            >
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.name}
                    {user.age ? `, ${user.age}` : ''}
                  </Text>
                  <Text style={styles.username}>@{user.username}</Text>
                  {user.bio && (
                    <Text style={styles.userBio} numberOfLines={2}>{user.bio}</Text>
                  )}
                </View>
                <View style={styles.onlineStatus}>
                  <View style={[styles.statusDot, { 
                    backgroundColor: user.isOnline ? '#4CAF50' : '#999' 
                  }]} />
                  <Text style={styles.statusText}>
                    {user.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>

              <View style={styles.userDetails}>
                {user.work && (
                  <View style={styles.detailItem}>
                    <Ionicons name="briefcase-outline" size={18} color="#FFF" />
                    <Text style={styles.detailText}>{user.work}</Text>
                  </View>
                )}
                {user.location && (
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={18} color="#FFF" />
                    <Text style={styles.detailText}>
                      {typeof user.location === 'string' 
                        ? user.location 
                        : `${user.location._lat}, ${user.location._long}`}
                    </Text>
                  </View>
                )}
              </View>

              {user.interests && user.interests.length > 0 && (
                <View style={styles.interestsContainer}>
                  {user.interests.slice(0, 4).map((interest, i) => (
                    <View key={i} style={styles.interestChip}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                  {user.interests.length > 4 && (
                    <View style={styles.interestChip}>
                      <Text style={styles.interestText}>+{user.interests.length - 4}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => handleMessage(user.id)}
                >
                  <Ionicons name="chatbubble-outline" size={24} color="#FF4B6A" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                >
                  <Ionicons name="heart-outline" size={24} color="#FFF" />
                  <Text style={styles.actionButtonText}>Like Profile</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Explore</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={24} color="#FF4B6A" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or username..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <CategoryChip 
            label="All" 
            icon="people-outline"
            isSelected={selectedCategory === 'All'}
            onPress={() => setSelectedCategory('All')}
          />
          <CategoryChip 
            label="Nearby" 
            icon="location-outline"
            isSelected={selectedCategory === 'Nearby'}
            onPress={() => setSelectedCategory('Nearby')}
          />
          <CategoryChip 
            label="Online" 
            icon="radio-outline"
            isSelected={selectedCategory === 'Online'}
            onPress={() => setSelectedCategory('Online')}
          />
          <CategoryChip 
            label="New" 
            icon="star-outline"
            isSelected={selectedCategory === 'New'}
            onPress={() => setSelectedCategory('New')}
          />
        </ScrollView>
      </View>

      {/* User Cards */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4B6A" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={user => user.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={64} color="#666" />
              <Text style={styles.emptyTitle}>
                {searchQuery.trim() ? 'No Users Found' : 'Start Exploring'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim() 
                  ? 'Try searching with a different name or username'
                  : 'Search for users to connect with'}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => searchUsers(searchQuery)}
              tintColor="#FF4B6A"
              colors={['#FF4B6A']}
            />
          }
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={20} tint="light" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Feather name="x" size={24} color="#262626" />
              </TouchableOpacity>
            </View>

            <View style={styles.filtersContainer}>
              <Text style={styles.filterSectionTitle}>Interests</Text>
              <View style={styles.interestsGrid}>
                {INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest.id}
                    style={[
                      styles.interestButton,
                      selectedInterests.includes(interest.name) && styles.selectedInterest
                    ]}
                    onPress={() => {
                      if (selectedInterests.includes(interest.name)) {
                        setSelectedInterests(selectedInterests.filter(i => i !== interest.name));
                      } else {
                        setSelectedInterests([...selectedInterests, interest.name]);
                      }
                    }}
                  >
                    <Feather 
                      name={interest.icon as any} 
                      size={20} 
                      color={selectedInterests.includes(interest.name) ? '#FFF' : '#262626'} 
                    />
                    <Text style={[
                      styles.interestButtonText,
                      selectedInterests.includes(interest.name) && styles.selectedInterestText
                    ]}>
                      {interest.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <View style={styles.filterOption}>
                  <Feather name="map-pin" size={20} color="#262626" />
                  <Text style={styles.filterOptionText}>Within 5 miles</Text>
                  <Feather name="chevron-right" size={20} color="#8E8E8E" />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Age Range</Text>
                <View style={styles.filterOption}>
                  <Feather name="users" size={20} color="#262626" />
                  <Text style={styles.filterOptionText}>18-35 years</Text>
                  <Feather name="chevron-right" size={20} color="#8E8E8E" />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSelectedInterests([]);
                }}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* User Profile Modal */}
      <UserProfileModal
        isVisible={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={selectedUser}
        onMessage={handleMessage}
        onFollowToggle={handleFollowToggle}
        isLoading={followLoading}
      />
    </Animated.View>
  );
}

// Add debounce utility function
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 15,
    backgroundColor: '#1a1a1a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#FFF',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingRight: 15,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#FF4B6A',
  },
  categoryChipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#FFF',
  },
  content: {
    padding: 15,
    gap: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    alignSelf: 'center',
    backgroundColor: '#2a2a2a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardTouchable: {
    flex: 1,
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  userInfo: {
    flex: 1,
    marginRight: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#FF4B6A',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  userDetails: {
    marginBottom: 15,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  interestText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionButtonSecondary: {
    width: 46,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#FF4B6A',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: 100,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#262626',
  },
  filtersContainer: {
    padding: 20,
  },
  filterSection: {
    marginTop: 30,
  },
  filterSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 15,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  selectedInterest: {
    backgroundColor: '#0095F6',
    borderColor: '#0095F6',
  },
  interestButtonText: {
    fontSize: 14,
    color: '#262626',
    fontWeight: '500',
  },
  selectedInterestText: {
    color: '#FFF',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    gap: 12,
  },
  filterOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#262626',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFF',
  },
  resetButton: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#F8F8F8',
  },
  resetButtonText: {
    color: '#262626',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#0095F6',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
