import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import FollowList from '../../components/FollowList';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserProfile } from '../../../src/types';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 40) / 3;

export default function ProfileScreen() {
  const { user, userData, setUserData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'photos' | 'about' | 'likes'>('photos');
  const [refreshing, setRefreshing] = useState(false);
  const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null);

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
    router.push('/profile/settings');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Add your refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFollowToggle = async (targetUserId: string, isFollowing: boolean) => {
    if (!user || !userData) return;

    try {
      // Update target user's followers list first
      await updateDoc(doc(db, 'users', targetUserId), {
        followers: isFollowing
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });

      // Then update current user's following list
      await updateDoc(doc(db, 'users', user.uid), {
        following: isFollowing 
          ? arrayRemove(targetUserId)
          : arrayUnion(targetUserId)
      });

      // Update local state after successful Firebase update
      const updatedUserData = {
        ...userData,
        following: isFollowing
          ? userData.following.filter(id => id !== targetUserId)
          : [...userData.following, targetUserId]
      };
      setUserData(updatedUserData);
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert(
        'Error',
        'Failed to update follow status. Please try again.',
        [{ text: 'OK' }]
      );
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

  const renderInfoItem = (icon: string, title: string, value: string | undefined) => {
    if (!value) return null;
    return (
      <View style={styles.infoItem}>
        <Ionicons name={icon as any} size={24} color="#0095F6" />
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

  if (!userData) return null;

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
              <Text style={styles.logoText}>Profile</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
              <Ionicons name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerContent}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ 
                  uri: userData.profilePicture || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random` 
                }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editPhotoButton} onPress={handleEditProfile}>
                <Ionicons name="camera" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>
                {userData.name}
                {userData.age ? `, ${userData.age}` : ''}
              </Text>
              <Text style={styles.username}>@{userData.username}</Text>
              {userData.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={16} color="white" />
                  <Text style={styles.location}>{userData.location}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Profile Stats */}
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.posts?.length || 0}</Text>
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
              <Text style={styles.statNumber}>{userData.followers?.length || 0}</Text>
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
              <Text style={styles.statNumber}>{userData.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Story Highlights */}
        {userData.photos && userData.photos.length > 0 && (
          <View style={styles.highlightsContainer}>
            <Text style={styles.highlightsTitle}>Story Highlights</Text>
            <FlatList
              data={userData.photos}
              renderItem={renderStoryHighlight}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightsList}
            />
          </View>
        )}

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
            {userData.photos && userData.photos.length > 0 ? (
              <FlatList
                data={userData.photos}
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
                <TouchableOpacity style={styles.addButton} onPress={handleEditProfile}>
                  <Text style={styles.addButtonText}>Add Photos</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.content}>
            {userData.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About Me</Text>
                <Text style={styles.bio}>{userData.bio}</Text>
              </View>
            )}

            {userData.interests && userData.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.interestsContainer}>
                  {userData.interests.map((interest, index) => (
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
                {renderInfoItem('school', 'Education', userData.education)}
                {renderInfoItem('briefcase', 'Work', userData.work)}
                {userData.languages && renderInfoItem('language', 'Languages', userData.languages.join(', '))}
                {renderInfoItem('body', 'Height', userData.height)}
                {renderInfoItem('star', 'Zodiac', userData.zodiac)}
              </BlurView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lifestyle</Text>
              <BlurView intensity={10} tint="light" style={styles.infoContainer}>
                {renderInfoItem('wine', 'Drinking', userData.drinking)}
                {renderInfoItem('leaf', 'Smoking', userData.smoking)}
                {renderInfoItem('heart', 'Looking For', userData.lookingFor)}
                {renderInfoItem('people', 'Children', userData.children)}
                {renderInfoItem('paw', 'Pets', userData.pets)}
              </BlurView>
            </View>

            {userData.personality && userData.personality.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personality</Text>
                <View style={styles.personalityContainer}>
                  {userData.personality.map((trait, index) => (
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

      {/* Follow List Modal */}
      <Modal
        visible={showFollowList !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowList(null)}
      >
        {showFollowList && userData && (
          <FollowList
            userIds={showFollowList === 'followers' ? userData.followers || [] : userData.following || []}
            onClose={() => setShowFollowList(null)}
            title={showFollowList === 'followers' ? 'Followers' : 'Following'}
            currentUserId={user?.uid || ''}
            onFollowToggle={handleFollowToggle}
            onRemoveFollower={handleRemoveFollower}
          />
        )}
      </Modal>
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
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
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
  infoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    color: '#999',
    fontSize: 14,
  },
  infoValue: {
    color: 'white',
    fontSize: 16,
    marginTop: 2,
  },
  personalityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  personalityTag: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  personalityText: {
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
  addButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
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
});
