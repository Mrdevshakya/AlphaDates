import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile } from '../../src/types';
import { useAuth } from '../context/AuthContext';
import { createNotification, deleteNotificationsByContent } from '../utils/notifications';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onMessage: (userId: string) => void;
  onFollowToggle: (userId: string, isFollowing: boolean) => void;
  isLoading: boolean;
}

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 60) / 3;

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isVisible,
  onClose,
  user,
  onMessage,
  onFollowToggle,
  isLoading,
}) => {
  const { userData, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'photos' | 'likes'>('photos');
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const TRANSPARENT_PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9f3rUQAAAABJRU5ErkJggg==';
  
  // Compute a safe string URI for the profile image
  const getProfileImageUri = () => {
    if (user && typeof user.profilePictureBase64 === 'string' && user.profilePictureBase64.length > 0) {
      return `data:image/jpeg;base64,${user.profilePictureBase64}`;
    }
    if (user && typeof (user as any).profilePicture === 'string' && (user as any).profilePicture.trim().length > 0) {
      return (user as any).profilePicture as string;
    }
    const displayName = user ? (user as any).name || (user as any).username || 'User' : 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  };
  
  const isFollowing = user ? userData?.following?.includes(user.id) || false : false;

  // Fetch user posts when modal opens
  useEffect(() => {
    if (isVisible && user) {
      fetchUserPosts();
    }
  }, [isVisible, user]);

  const fetchUserPosts = async () => {
    if (!user) return;
    
    setLoadingPosts(true);
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      const postsData = postsSnapshot.docs.map(doc => {
        const postData = doc.data();
        const mediaUrl = postData.imageBase64 || postData.imageUrl || postData.videoUrl;
        const mediaType = (postData.imageBase64 || postData.imageUrl) ? 'image' : 'video';
        return {
          id: doc.id,
          ...postData,
          mediaUrl,
          mediaType,
        };
      });
      
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !currentUser) return;
    
    onFollowToggle(user.id, isFollowing);
    
    if (isFollowing) {
      // Delete follow notification when unfollowing
      try {
        await deleteNotificationsByContent(
          'follow',
          currentUser.uid,
          user.id
        );
      } catch (error) {
        console.error('Error deleting follow notification:', error);
      }
    } else {
      // Create follow notification when following
      try {
        await createNotification(
          'follow',
          currentUser.uid,
          user.id
        );
      } catch (error) {
        console.error('Error creating follow notification:', error);
      }
    }
  };

  const renderPhoto = ({ item }: { item: any }) => {
    const uri = typeof item?.mediaUrl === 'string' && item.mediaUrl.trim().length > 0
      ? item.mediaUrl
      : TRANSPARENT_PX;
    return (
      <TouchableOpacity style={styles.photoContainer}>
        <Image source={{ uri }} style={styles.photo} />
        {item.mediaType === 'video' && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={20} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!user) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <LinearGradient
              colors={['#FF4B6A', '#FF8C9F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.profileImageContainer}>
                <Image
                  source={{
                    uri: getProfileImageUri()
                  }}
                  style={styles.profileImage}
                />
              </View>

              <View style={styles.headerInfo}>
                <Text style={styles.name}>
                  {user.name}
                  {user.age ? `, ${user.age}` : ''}
                </Text>
                <Text style={styles.username}>@{user.username}</Text>
                {user.bio && (
                  <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>
                )}
                {user.location && (
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={16} color="white" />
                    <Text style={styles.location}>
                      {typeof user.location === 'string' 
                        ? user.location 
                        : `${user.location._lat}, ${user.location._long}`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Profile Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{posts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.followers?.length || 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.following?.length || 0}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => onMessage(user.id)}
                >
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, isLoading && styles.disabledButton]}
                  onPress={handleFollowToggle}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>
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
                {loadingPosts ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color="#FF4B6A" />
                    <Text style={styles.emptyStateText}>Loading posts...</Text>
                  </View>
                ) : posts.length > 0 ? (
                  <FlatList
                    data={posts}
                    renderItem={renderPhoto}
                    numColumns={3}
                    scrollEnabled={false}
                    style={styles.photosGrid}
                    contentContainerStyle={styles.photosContent}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="camera-outline" size={48} color="#666" />
                    <Text style={styles.emptyStateText}>No posts yet</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'likes' && (
              <View style={styles.likesContainer}>
                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={48} color="#666" />
                  <Text style={styles.emptyStateText}>No likes yet</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginTop: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  headerInfo: {
    alignItems: 'center',
    marginTop: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  location: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 0.48,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    padding: 20,
  },
  photosGrid: {
    width: '100%',
  },
  photosContent: {
    gap: 5,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    marginRight: 5,
    marginBottom: 5,
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
    transform: [{ translateX: -10 }, { translateY: -10 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  likesContainer: {
    padding: 20,
  }
});

export default UserProfileModal; 