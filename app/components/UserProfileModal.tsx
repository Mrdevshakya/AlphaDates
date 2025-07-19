import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'photos' | 'about' | 'likes'>('about');
  
  const isFollowing = user ? userData?.following?.includes(user.id) || false : false;

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

  const renderInfoItem = (icon: string, title: string, value: string | undefined) => {
    if (!value) return null;
    return (
      <View style={styles.infoItem}>
        <Ionicons name={icon as any} size={20} color="#0095F6" />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const renderPhoto = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.photoContainer}>
      <Image source={{ uri: item }} style={styles.photo} />
    </TouchableOpacity>
  );

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
                    uri: user.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
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
                {user.location && (
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={16} color="white" />
                    <Text style={styles.location}>{user.location}</Text>
                  </View>
                )}
              </View>

              {/* Profile Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.posts?.length || 0}</Text>
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
                style={[styles.tab, activeTab === 'about' && styles.activeTab]}
                onPress={() => setActiveTab('about')}
              >
                <Ionicons 
                  name="person-outline" 
                  size={24} 
                  color={activeTab === 'about' ? '#FF4B6A' : '#666'} 
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
                {user.photos && user.photos.length > 0 ? (
                  <FlatList
                    data={user.photos}
                    renderItem={renderPhoto}
                    numColumns={3}
                    scrollEnabled={false}
                    style={styles.photosGrid}
                    contentContainerStyle={styles.photosContent}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={48} color="#666" />
                    <Text style={styles.emptyStateText}>No photos yet</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'about' && (
              <View style={styles.content}>
                {user.bio && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Me</Text>
                    <Text style={styles.bio}>{user.bio}</Text>
                  </View>
                )}

                {user.interests && user.interests.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Interests</Text>
                    <View style={styles.interestsContainer}>
                      {user.interests.map((interest, index) => (
                        <View key={index} style={styles.interestTag}>
                          <Text style={styles.interestText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Basic Info</Text>
                  <BlurView intensity={10} tint="light" style={styles.infoContainer}>
                    {renderInfoItem('school', 'Education', user.education)}
                    {renderInfoItem('briefcase', 'Work', user.work)}
                    {user.languages && renderInfoItem('language', 'Languages', user.languages.join(', '))}
                    {renderInfoItem('body', 'Height', user.height)}
                    {renderInfoItem('star', 'Zodiac', user.zodiac)}
                  </BlurView>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Lifestyle</Text>
                  <BlurView intensity={10} tint="light" style={styles.infoContainer}>
                    {renderInfoItem('wine', 'Drinking', user.drinking)}
                    {renderInfoItem('leaf', 'Smoking', user.smoking)}
                    {renderInfoItem('heart', 'Looking For', user.lookingFor)}
                    {renderInfoItem('people', 'Children', user.children)}
                    {renderInfoItem('paw', 'Pets', user.pets)}
                  </BlurView>
                </View>

                {user.personality && user.personality.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personality</Text>
                    <View style={styles.personalityContainer}>
                      {user.personality.map((trait, index) => (
                        <View key={index} style={styles.personalityTag}>
                          <Text style={styles.personalityText}>{trait}</Text>
                        </View>
                      ))}
                    </View>
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  bio: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#555',
    fontSize: 14,
  },
  infoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoText: {
    marginLeft: 10,
  },
  infoTitle: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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
  content: {
    paddingBottom: 20,
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
  },
  personalityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  personalityTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  personalityText: {
    color: '#555',
    fontSize: 14,
  },
});

export default UserProfileModal; 