import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
  FlatList,
  RefreshControl,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { collection, query, where, orderBy, doc, getDoc, updateDoc, arrayRemove, arrayUnion, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, Story } from '../../src/types';
import { createOrGetChatRoom } from '../utils/chat';
import PostDetailModal from '../components/PostDetailModal';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 40) / 3;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const { user, userData } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<Array<{ story: Story; user: UserProfile }>>([]);
  const [posts, setPosts] = useState<Array<{ post: any; user: UserProfile }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  
  const isOwnProfile = !id || id === user?.uid;
  const displayData = isOwnProfile ? userData : profileData;

  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      let currentProfileData = userData; // Default to current user's data
      
      if (!isOwnProfile && id) {
        // Load other user's profile first
        const userRef = doc(db, 'users', id as string);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const otherUserData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
          setProfileData(otherUserData);
          currentProfileData = otherUserData; // Use the loaded profile data
          
          // Check if current user is following this user
          if (otherUserData?.followers) {
            setIsFollowing(otherUserData.followers.includes(user.uid));
          }
        }
      }

      // Load stories and posts with the correct profile data
      const targetUserId = isOwnProfile ? user.uid : id;
      if (targetUserId && currentProfileData) {
        const storiesQuery = query(
          collection(db, 'stories'),
          where('userId', '==', targetUserId),
          orderBy('createdAt', 'desc')
        );
        
        const storiesSnapshot = await getDocs(storiesQuery);
        const storiesData = storiesSnapshot.docs
          .map(doc => {
            return {
              story: { id: doc.id, ...doc.data() } as Story,
              user: currentProfileData,
            };
          });

        setStories(storiesData);
        
        // Load posts with the correct profile data
        const postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', targetUserId),
          orderBy('createdAt', 'desc')
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs
          .map(doc => {
            const postData = doc.data();
            
            // Convert Firestore timestamp to Date if needed
            const createdAt = postData.createdAt?.toDate ? postData.createdAt.toDate() : new Date(postData.createdAt);
            
            return {
              post: { 
                id: doc.id, 
                ...postData,
                createdAt,
                // Handle imageBase64, imageUrl or videoUrl for media display
                mediaUrl: postData.imageBase64 || postData.imageUrl || postData.videoUrl,
                mediaType: (postData.imageBase64 || postData.imageUrl) ? 'image' : 'video'
              },
              user: currentProfileData,
            };
          });

        setPosts(postsData);
      }
      
      setLoading(false);
    };
    
    loadProfile();
  }, [user, id, isOwnProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Reload profile data
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!user || !userData || !displayData) return;

    try {
      const currentUserRef = doc(db, 'users', user.uid);
      const targetUserRef = doc(db, 'users', displayData.id);

      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, {
          following: arrayRemove(displayData.id)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(user.uid)
        });
        setIsFollowing(false);
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion(displayData.id)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(user.uid)
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleMessage = async () => {
    if (!user || !displayData) return;
    
    try {
      const chatRoomId = await createOrGetChatRoom(user.uid, displayData.id);
      router.push(`/chats/chat/${chatRoomId}`);
    } catch (error) {
      console.error('Error creating chat room:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const handlePostPress = (index: number) => {
    setSelectedPostIndex(index);
    setShowPostModal(true);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const postRef = doc(db, 'posts', postId);
      
      // Find the current post to check if user has already liked it
      const currentPost = posts.find(item => item.post.id === postId);
      if (!currentPost) return;
      
      const isLiked = (currentPost.post.likes || []).includes(user.uid);
      
      if (isLiked) {
        // Unlike the post
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
        
        // Update local state - remove like
        setPosts(currentPosts => 
          currentPosts.map(item => 
            item.post.id === postId
              ? {
                  ...item,
                  post: {
                    ...item.post,
                    likes: (item.post.likes || []).filter(uid => uid !== user.uid)
                  }
                }
              : item
          )
        );
      } else {
        // Like the post
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
        
        // Update local state - add like
        setPosts(currentPosts => 
          currentPosts.map(item => 
            item.post.id === postId
              ? {
                  ...item,
                  post: {
                    ...item.post,
                    likes: [...(item.post.likes || []), user.uid]
                  }
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    if (!user || !userData) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        id: Date.now().toString(),
        userId: user.uid,
        username: userData.username || userData.name || 'Unknown User',
        text: comment,
        createdAt: new Date(),
        likes: []
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      // Update local state
      setPosts(currentPosts =>
        currentPosts.map(item =>
          item.post.id === postId
            ? {
                ...item,
                post: {
                  ...item.post,
                  comments: [...(item.post.comments || []), newComment]
                }
              }
            : item
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const renderPost = ({ item, index }: { item: { post: any; user: UserProfile }; index: number }) => (
    <TouchableOpacity 
      style={styles.photoContainer}
      onPress={() => handlePostPress(index)}
      activeOpacity={0.8}
    >
      <Image
        source={{ 
          uri: item.post.mediaUrl || item.post.mediaUri 
        }}
        style={styles.photo}
        resizeMode="cover"
      />
      {item.post.mediaType === 'video' && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={24} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6A" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!displayData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={80} color="#666" />
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderProfileHeader = () => (
    <View>
      {/* Profile Header */}
      <LinearGradient
        colors={['#FF4B6A', '#FF8C9F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.logoText}>@{displayData.username}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ 
                uri: displayData.profilePictureBase64 ? 
                  `data:image/jpeg;base64,${displayData.profilePictureBase64}` :
                  displayData.profilePicture || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(displayData.name)}&background=random`
              }}
              style={styles.profileImage}
            />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.name}>
              {displayData.name}
              {displayData.age ? `, ${displayData.age}` : ''}
            </Text>
            {displayData.bio && (
              <Text style={styles.bio} numberOfLines={3}>{displayData.bio}</Text>
            )}
            {displayData.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="white" />
                <Text style={styles.location}>
                  {typeof displayData.location === 'string'
                    ? displayData.location
                    : typeof displayData.location === 'object' && displayData.location._lat && displayData.location._long
                      ? `${displayData.location._lat.toFixed(4)}, ${displayData.location._long.toFixed(4)}`
                      : 'Location available'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </TouchableOpacity>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statDivider}
          />
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{displayData.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statDivider}
          />
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{displayData.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={20} color="white" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}
        >
          <Ionicons
            name="grid-outline"
            size={24}
            color={activeTab === 'photos' ? '#FF4B6A' : '#666'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="camera-outline" size={60} color="#666" />
      <Text style={styles.emptyStateText}>No posts yet</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts.length > 0 ? posts : [{ isEmpty: true }]}
        renderItem={posts.length > 0 ? ({ item, index }) => renderPost({ item, index }) : renderEmptyState}
        keyExtractor={(item, index) => posts.length > 0 ? item.post.id : `empty-${index}`}
        numColumns={posts.length > 0 ? 3 : 1}
        key={posts.length > 0 ? 'posts' : 'empty'}
        ListHeaderComponent={renderProfileHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.photosContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF4B6A"
          />
        }
      />
      
      {/* Post Detail Modal */}
      <PostDetailModal
        visible={showPostModal}
        posts={posts}
        initialIndex={selectedPostIndex}
        onClose={() => setShowPostModal(false)}
        onLike={handleLike}
        onComment={handleComment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
  },
  headerInfo: {
    flex: 1,
    paddingTop: 5,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  followButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  followButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  messageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF4B6A',
  },
  photosContainer: {
    flex: 1,
  },
  photosGrid: {
    marginHorizontal: -4,
  },
  photosContent: {
    paddingHorizontal: 4,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#666',
    fontSize: 18,
    marginVertical: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
