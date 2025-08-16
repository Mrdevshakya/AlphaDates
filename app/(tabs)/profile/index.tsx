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
  ImageBackground,
  RefreshControl,
  Modal,
  Alert,
  Share,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import FollowList from '../../components/FollowList';
import Stories from '../../components/Stories';
import { collection, query, where, orderBy, doc, getDoc, updateDoc, arrayRemove, arrayUnion, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserProfile, Story } from '../../../src/types';
import { createOrGetChatRoom } from '../../utils/chat';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { pickStoryMedia, uploadStory } from '../../utils/stories';
import PostDetailModal from '../../components/PostDetailModal';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 40) / 3;
const QR_CODE_SIZE = width * 0.7;

interface QRCodeRef {
  toDataURL: (callback: (dataURL: string) => void) => void;
}

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { user, userData, setUserData, logout } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const isOwnProfile = !userId || userId === user?.uid;
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRef, setQrRef] = useState<QRCodeRef | null>(null);
  const [stories, setStories] = useState<Array<{ story: Story; user: UserProfile }>>([]);
  const [posts, setPosts] = useState<Array<{ post: any; user: UserProfile }>>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  
  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      if (!isOwnProfile && userId) {
        // Load other user's profile
        const userRef = doc(db, 'users', userId as string);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setProfileData({ id: userDoc.id, ...userDoc.data() } as UserProfile);
        }
      }

      // Load stories
      const targetUserId = isOwnProfile ? user.uid : userId;
      if (targetUserId) {
        const storiesQuery = query(
          collection(db, 'stories'),
          where('userId', '==', targetUserId),
          orderBy('createdAt', 'desc')
        );
        
        const storiesSnapshot = await getDocs(storiesQuery);
        const storiesData = storiesSnapshot.docs
          .map(doc => {
            const user = isOwnProfile ? userData : profileData;
            if (!user) return null;
            return {
              story: { id: doc.id, ...doc.data() } as Story,
              user,
            };
          })
          .filter((item): item is { story: Story; user: UserProfile } => item !== null);

        setStories(storiesData);
        
        // Load posts
        const postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', targetUserId),
          orderBy('createdAt', 'desc')
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs
          .map(doc => {
            const user = isOwnProfile ? userData : profileData;
            if (!user) return null;
            return {
              post: { id: doc.id, ...doc.data() },
              user,
            };
          })
          .filter((item): item is { post: any; user: UserProfile } => item !== null);

        setPosts(postsData);
      }
    };
    
    loadProfile();
  }, [user, userId, userData, profileData]);

  const displayData = isOwnProfile ? userData : profileData;

  const [activeTab, setActiveTab] = useState<'photos' | 'likes'>('photos');
  const [refreshing, setRefreshing] = useState(false);
  const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleSettings = () => {
    router.push('/profile/settings/account');
  };

  const handleShareProfile = () => {
    setShowQRModal(true);
  };

  const handleCloseQR = () => {
    setShowQRModal(false);
  };

  const saveQRCode = async () => {
    if (!qrRef) return;

    try {
      // Get QR code as base64 string
      const qrImage = await new Promise<string>((resolve) => {
        qrRef.toDataURL((dataURL: string) => resolve(dataURL));
      });

      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        // Save QR code to temporary file
        const filePath = `${FileSystem.cacheDirectory}qr-code.png`;
        await FileSystem.writeAsStringAsync(filePath, qrImage, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Share the QR code
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        }
      }
    } catch (error) {
      console.error('Error saving QR code:', error);
    }
  };

  const handleShare = async () => {
    const profileUrl = `alphadate-app://profile/${userId || user?.uid}`;
    try {
      await Share.share({
        message: `Check out my profile on AlphaDate: ${profileUrl}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Add your refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFollowToggle = async (targetUserId: string, isFollowing: boolean) => {
    if (!user || !userData) {
      Alert.alert('Error', 'Please sign in to follow users');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      // Initialize arrays if they don't exist
      const currentUserRef = doc(db, 'users', user.uid);
      if (!userData.following) {
        await updateDoc(currentUserRef, {
          following: []
        });
      }

      // Get references to both user documents
      const targetUserRef = doc(db, 'users', targetUserId);
      const targetUserDoc = await getDoc(targetUserRef);
      
      if (!targetUserDoc.exists()) {
        Alert.alert('Error', 'User not found');
        setIsLoading(false);
        return;
      }

      const targetUserData = targetUserDoc.data();
      if (!targetUserData.followers) {
        await updateDoc(targetUserRef, {
          followers: []
        });
      }

      // Update target user's followers list
      await updateDoc(targetUserRef, {
        followers: isFollowing
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });

      // Update current user's following list
      await updateDoc(currentUserRef, {
        following: isFollowing 
          ? arrayRemove(targetUserId)
          : arrayUnion(targetUserId)
      });

      // Update local state with proper array initialization
      const updatedUserData = {
        ...userData,
        following: isFollowing
          ? (userData.following || []).filter(id => id !== targetUserId)
          : [...(userData.following || []), targetUserId]
      };
      setUserData(updatedUserData);

      // Update profile data if we're viewing another user's profile
      if (!isOwnProfile && profileData) {
        setProfileData({
          ...profileData,
          followers: isFollowing
            ? (profileData.followers || []).filter(id => id !== user.uid)
            : [...(profileData.followers || []), user.uid]
        });
      }

    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert(
        'Error',
        'Failed to update follow status. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!user || !userData) return;

    try {
      // Remove follower from current user's followers list first
      await updateDoc(doc(db, 'users', user.uid), {
        followers: arrayRemove(followerId)
      });

      // Then remove current user from follower's following list
      await updateDoc(doc(db, 'users', followerId), {
        following: arrayRemove(user.uid)
      });

      // Update local state after successful Firebase update
      const updatedUserData = {
        ...userData,
        followers: userData.followers.filter(id => id !== followerId)
      };
      setUserData(updatedUserData);
    } catch (error) {
      console.error('Error removing follower:', error);
      Alert.alert(
        'Error',
        'Failed to remove follower. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMessage = async () => {
    if (!user || !userId || typeof userId !== 'string') {
      Alert.alert('Error', 'Cannot start chat at this time');
      return;
    }

    try {
      const chatRoomId = await createOrGetChatRoom(user.uid, userId);
      router.push(`/chats/chat/${chatRoomId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert(
        'Error',
        'Failed to start chat. Please try again.'
      );
    }
  };

  const handleStoryPress = (storyId: string) => {
    // Navigate to story viewer
    router.push({
      pathname: '/stories/[id]',
      params: { id: storyId }
    });
  };

  const handleStoryAdded = async () => {
    // Reload stories after a new one is added
    if (!user || !userData) return;

    const storiesQuery = query(
      collection(db, 'stories'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const storiesSnapshot = await getDocs(storiesQuery);
    const storiesData = storiesSnapshot.docs.map(doc => ({
      story: { id: doc.id, ...doc.data() } as Story,
      user: userData,
    }));

    setStories(storiesData);
  };

  const handleAddStory = async () => {
    if (!user) return;

    try {
      const mediaResult = await pickStoryMedia();
      if (!mediaResult) return;

      setUploading(true);
      const mediaType = mediaResult.type === 'video' ? 'video' : 'image';

      await uploadStory(
        user.uid,
        mediaResult.uri,
        mediaType,
        (progress) => setUploadProgress(progress)
      );

      setUploading(false);
      setUploadProgress(0);
      handleStoryAdded();
    } catch (error) {
      console.error('Error uploading story:', error);
      Alert.alert(
        'Error',
        'Failed to upload story. Please try again.'
      );
      setUploading(false);
      setUploadProgress(0);
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
        source={{ uri: item.post.imageBase64 || item.post.imageUrl || item.post.videoUrl }} 
        style={styles.photo} 
      />
      {item.post.videoUrl && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={24} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStoryHighlight = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.storyHighlight}>
      <ImageBackground source={{ uri: item }} style={styles.storyImage}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
          style={styles.storyGradient}
        >
          <Text style={styles.storyText}>Highlight</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  if (!displayData) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF4B6A"
          />
        }
      >
        {/* Profile Header */}
        <LinearGradient
          colors={['#FF4B6A', '#FF8C9F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerTitle}>
              <Text style={styles.logoText}>@{displayData.username}</Text>
            </View>
            {isOwnProfile ? (
              <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
                <Ionicons name="settings-outline" size={24} color="white" />
              </TouchableOpacity>
            ) : null}
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
              {isOwnProfile && (
                <TouchableOpacity 
                  style={styles.editPhotoButton} 
                  onPress={handleAddStory}
                  disabled={true}
                >
                  {uploading ? (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color="#FF4B6A" />
                      <Text style={styles.uploadingText}>{Math.round(uploadProgress)}%</Text>
                    </View>
                  ) : (
                    <Ionicons name="add" size={20} color="white" />
                  )}
                </TouchableOpacity>
              )}
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
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => setShowFollowList('followers')}
            >
              <Text style={styles.statNumber}>{displayData.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statDivider}
            />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => setShowFollowList('following')}
            >
              <Text style={styles.statNumber}>{displayData.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
                  <Text style={styles.actionButtonText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleShareProfile}>
                  <Text style={styles.actionButtonText}>Share Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.actionButton,
                    isLoading && styles.disabledButton
                  ]} 
                  onPress={() => {
                    if (!isLoading && typeof userId === 'string') {
                      handleFollowToggle(
                        userId, 
                        userData?.following?.includes(userId) || false
                      );
                    }
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.actionButtonText}>
                    {isLoading ? 'Loading...' : (userData?.following?.includes(typeof userId === 'string' ? userId : '') ? 'Unfollow' : 'Follow')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleShareProfile}>
                  <Text style={styles.actionButtonText}>Share Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </LinearGradient>

        {/* Profile Tabs */}
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
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
            onPress={() => setActiveTab('likes')}
          >
            <Ionicons 
              name="heart-outline" 
              size={24} 
              color={activeTab === 'likes' ? '#FF4B6A' : '#666'} 
            />
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'photos' && (
          <View style={styles.photosContainer}>
            {posts && posts.length > 0 ? (
              <FlatList
                data={posts}
                renderItem={({ item, index }) => renderPost({ item, index })}
                keyExtractor={(item) => item.post.id}
                numColumns={3}
                scrollEnabled={false}
                style={styles.photosGrid}
                contentContainerStyle={styles.photosContent}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>No posts yet</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'likes' && (
          <View style={styles.likesContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Likes</Text>
              <View style={styles.likesList}>
                {/* Add your likes list here */}
                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={48} color="#666" />
                  <Text style={styles.emptyStateText}>No likes yet</Text>
                  <TouchableOpacity style={styles.exploreButton}>
                    <Text style={styles.exploreButtonText}>Start Exploring</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseQR}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseQR}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Share Profile</Text>
            <Text style={styles.modalSubtitle}>Scan this QR code to view profile</Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={`alphadate-app://profile/${userId || user?.uid}`}
                size={QR_CODE_SIZE}
                getRef={(ref) => setQrRef(ref)}
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={saveQRCode}>
                <Ionicons name="download-outline" size={24} color="white" />
                <Text style={styles.modalButtonText}>Save QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalButton} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={24} color="white" />
                <Text style={styles.modalButtonText}>Share Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Follow List Modal */}
      <Modal
        visible={showFollowList !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowList(null)}
      >
        {showFollowList && displayData && (
          <FollowList
            userIds={showFollowList === 'followers' ? displayData.followers || [] : displayData.following || []}
            onClose={() => setShowFollowList(null)}
            title={showFollowList === 'followers' ? 'Followers' : 'Following'}
            currentUserId={user?.uid || ''}
            onFollowToggle={handleFollowToggle}
            onRemoveFollower={handleRemoveFollower}
          />
        )}
      </Modal>

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
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF4B6A',
  },
  noPhotoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4B6A',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  username: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: 'white',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  highlightsContainer: {
    padding: 20,
  },
  highlightsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  highlightsList: {
    paddingRight: 20,
  },
  storyHighlight: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 10,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 5,
  },
  storyText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
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
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  bio: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  interestTag: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  interestText: {
    color: 'white',
    fontSize: 14,
  },
  likesContainer: {
    padding: 20,
  },
  likesList: {
    minHeight: 200,
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

  exploreButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    marginTop: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 30,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  uploadingContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  uploadingText: {
    color: '#FF4B6A',
    fontSize: 8,
    marginTop: 2,
  },
});
