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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 40) / 2;

// Mock data (replace with real data from your backend)
const USER_DATA = {
  interests: ['Travel', 'Photography', 'Music', 'Cooking', 'Fitness', 'Art'],
  languages: ['English', 'Spanish'],
  education: 'Bachelor in Computer Science',
  work: 'Software Developer at Tech Corp',
  height: "5'9\"",
  zodiac: 'Leo',
  drinking: 'Social Drinker',
  smoking: 'Non-smoker',
  lookingFor: 'Long-term Relationship',
  children: "Don't have children",
  pets: 'Dog lover 🐕',
  personality: ['Extrovert', 'Creative', 'Ambitious'],
};

// Define valid icon names type
type IconName = 
  | 'heart-outline'
  | 'chatbubbles-outline'
  | 'shield-checkmark-outline'
  | 'filter-outline'
  | 'infinite-outline'
  | 'school-outline'
  | 'briefcase-outline'
  | 'body-outline'
  | 'star-outline'
  | 'wine-outline'
  | 'leaf-outline'
  | 'people-outline'
  | 'paw-outline'
  | 'image-outline';

// Update the icon map with proper typing
const iconMap: Record<string, IconName> = {
  'heart': 'heart-outline',
  'chat': 'chatbubbles-outline',
  'shield': 'shield-checkmark-outline',
  'filter': 'filter-outline',
  'infinite': 'infinite-outline',
  'school': 'school-outline',
  'briefcase': 'briefcase-outline',
  'body': 'body-outline',
  'star': 'star-outline',
  'wine': 'wine-outline',
  'leaf': 'leaf-outline',
  'people': 'people-outline',
  'paw': 'paw-outline',
  'image': 'image-outline'
} as const;

export default function ProfileScreen({ userId }: { userId?: string }) {
  const { currentUser, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  
  // Check if this is the current user's profile
  const isOwnProfile = !userId || userId === currentUser?.id;

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/sign-in');
  };

  const renderInfoItem = (icon: keyof typeof iconMap, label: string, value: string) => (
    <View style={styles.infoItem}>
      <Ionicons name={iconMap[icon]} size={24} color="#FF4B6A" />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const renderOwnProfileHeader = () => (
    <View style={styles.headerTop}>
      <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
        <Ionicons name="log-out-outline" size={24} color="#FF4B6A" />
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/profile/settings')}
        style={styles.headerButton}
      >
        <Ionicons name="settings-outline" size={24} color="#FF4B6A" />
      </TouchableOpacity>
    </View>
  );

  const renderOtherProfileHeader = () => (
    <View style={styles.headerTop}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.headerButton}
      >
        <Ionicons name="arrow-back" size={24} color="#FF4B6A" />
      </TouchableOpacity>
    </View>
  );

  const renderOwnProfileActions = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.editButton]}
        onPress={() => router.push('/(tabs)/profile/edit')}
      >
        <Ionicons name="create-outline" size={24} color="white" />
        <Text style={styles.actionButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOtherUserActions = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
        <Ionicons name={iconMap.chat} size={24} color="white" />
        <Text style={styles.actionButtonText}>Message</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.likeButton]}>
        <Ionicons name={iconMap.heart} size={24} color="white" />
        <Text style={styles.actionButtonText}>Like Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d1f3f']}
        style={styles.gradient}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.header}>
            {isOwnProfile ? renderOwnProfileHeader() : renderOtherProfileHeader()}

            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#FF4B6A', '#FF8C9F']}
                  style={styles.avatarGradient}
                >
                  <Image
                    source={{ uri: 'https://picsum.photos/200/200' }}
                    style={styles.avatar}
                  />
                </LinearGradient>
                {isOwnProfile && (
                  <TouchableOpacity 
                    style={styles.editAvatarButton}
                    onPress={() => router.push('/(tabs)/profile/edit')}
                  >
                    <Ionicons name="camera" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.name}>{currentUser?.name}, 25</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location-sharp" size={16} color="#FF4B6A" />
                <Text style={styles.location}>New York, USA • 5 miles away</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#FF4B6A" />
                <Text style={styles.verifiedText}>Verified Profile</Text>
              </View>
            </View>
          </View>

          {/* Stats Section - Shown for both profiles */}
          <View style={styles.statsContainer}>
            {[
              { label: 'Match Rate', value: '85%', icon: 'heart' },
              { label: 'Response Rate', value: '92%', icon: 'chat' },
              { label: 'Active Status', value: 'Daily', icon: 'infinite' },
            ].map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <LinearGradient
                  colors={['#FF4B6A', '#FF8C9F']}
                  style={styles.statIconContainer}
                >
                  <Ionicons name={iconMap[stat.icon]} size={24} color="white" />
                </LinearGradient>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Show these sections only for other users' profiles */}
          {!isOwnProfile && (
            <>
              {/* About Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About Me</Text>
                <Text style={styles.aboutText}>
                  Passionate about technology and creativity. Love exploring new places and meeting interesting people. 
                  Always up for a good conversation over coffee ☕️
                  {!showMore && '...'}
                </Text>
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowMore(!showMore)}
                >
                  <Text style={styles.showMoreText}>
                    {showMore ? 'Show Less' : 'Show More'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Interests Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.interestsContainer}>
                  {USER_DATA.interests.map((interest, index) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Basic Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Info</Text>
                <View style={styles.infoContainer}>
                  {renderInfoItem('school', 'Education', USER_DATA.education)}
                  {renderInfoItem('briefcase', 'Work', USER_DATA.work)}
                  {renderInfoItem('body', 'Height', USER_DATA.height)}
                  {renderInfoItem('star', 'Zodiac', USER_DATA.zodiac)}
                </View>
              </View>

              {/* Lifestyle Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lifestyle</Text>
                <View style={styles.infoContainer}>
                  {renderInfoItem('wine', 'Drinking', USER_DATA.drinking)}
                  {renderInfoItem('leaf', 'Smoking', USER_DATA.smoking)}
                  {renderInfoItem('heart', 'Looking For', USER_DATA.lookingFor)}
                  {renderInfoItem('people', 'Children', USER_DATA.children)}
                  {renderInfoItem('paw', 'Pets', USER_DATA.pets)}
                </View>
              </View>

              {/* Personality Traits */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personality</Text>
                <View style={styles.personalityContainer}>
                  {USER_DATA.personality.map((trait, index) => (
                    <View key={index} style={styles.personalityTag}>
                      <Text style={styles.personalityText}>{trait}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Photos Section - shown for all profiles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photosGrid}>
              {Array(6).fill(null).map((_, index) => (
                <TouchableOpacity key={index} style={styles.photoContainer}>
                  <Image
                    source={{ uri: `https://picsum.photos/400/400?random=${index}` }}
                    style={styles.photo}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.photoOverlay}
                  >
                    <Ionicons name="image" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          {isOwnProfile ? renderOwnProfileActions() : renderOtherUserActions()}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  avatarGradient: {
    padding: 3,
    borderRadius: 50,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4B6A',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    color: '#ccc',
    marginLeft: 5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,75,106,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    color: '#FF4B6A',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  aboutText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  showMoreButton: {
    marginTop: 10,
  },
  showMoreText: {
    color: '#FF4B6A',
    fontSize: 14,
    fontWeight: '600',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  interestTag: {
    backgroundColor: 'rgba(255,75,106,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5,
  },
  interestText: {
    color: '#FF4B6A',
    fontSize: 14,
  },
  infoContainer: {
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 15,
  },
  infoLabel: {
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
    marginHorizontal: -5,
  },
  personalityTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5,
  },
  personalityText: {
    color: 'white',
    fontSize: 14,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#FF4B6A',
  },
  messageButton: {
    backgroundColor: '#2d1f3f',
  },
  likeButton: {
    backgroundColor: '#FF4B6A',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
