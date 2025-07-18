import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Story, UserProfile } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const STORY_SIZE = 80;
const STORY_SPACING = 12;

interface StoriesProps {
  stories: Array<{ story: Story; user: UserProfile }>;
  onStoryPress: (storyId: string) => void;
}

export default function Stories({ stories, onStoryPress }: StoriesProps) {
  const { user: currentUser } = useAuth();

  if (!stories.length) return null;

  const userStories = stories.reduce((acc, { story, user }) => {
    if (!acc[user.id]) {
      acc[user.id] = {
        user,
        stories: [],
        hasUnseenStories: false,
      };
    }
    acc[user.id].stories.push(story);
    // Check if user has any unseen stories
    if (!story.seenBy.includes(currentUser?.uid || '')) {
      acc[user.id].hasUnseenStories = true;
    }
    return acc;
  }, {} as Record<string, { user: UserProfile; stories: Story[]; hasUnseenStories: boolean }>);

  return (
    <BlurView intensity={10} tint="dark" style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        decelerationRate="fast"
        snapToInterval={STORY_SIZE + STORY_SPACING}
      >
        {/* Add Story Button */}
        {currentUser && (
          <TouchableOpacity style={styles.storyItem}>
            <View style={styles.addStoryContainer}>
              <Image
                source={{
                  uri: currentUser.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=random`,
                }}
                style={styles.storyImage}
              />
              <LinearGradient
                colors={['#FF4B6A', '#FF8C9F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.username} numberOfLines={1}>
              Your Story
            </Text>
          </TouchableOpacity>
        )}

        {/* User Stories */}
        {Object.values(userStories).map(({ user, stories, hasUnseenStories }) => (
          <TouchableOpacity
            key={user.id}
            style={styles.storyItem}
            onPress={() => onStoryPress(stories[0].id)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={
                hasUnseenStories
                  ? ['#FF4B6A', '#FF8C9F']
                  : ['#666', '#444']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyRing}
            >
              <View style={styles.storyImageContainer}>
                <Image
                  source={{
                    uri: user.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
                  }}
                  style={styles.storyImage}
                />
                {stories.length > 1 && (
                  <View style={styles.storyCount}>
                    <Text style={styles.storyCountText}>{stories.length}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
            <Text style={styles.username} numberOfLines={1}>
              {user.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26,26,26,0.8)',
    marginBottom: 8,
  },
  scrollView: {
    paddingVertical: 12,
  },
  contentContainer: {
    paddingHorizontal: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: STORY_SPACING,
    width: STORY_SIZE,
  },
  addStoryContainer: {
    width: STORY_SIZE - 4,
    height: STORY_SIZE - 4,
    borderRadius: STORY_SIZE / 2,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    padding: 2,
    marginBottom: 8,
  },
  storyImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: (STORY_SIZE - 4) / 2,
    backgroundColor: '#1a1a1a',
    padding: 2,
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: (STORY_SIZE - 8) / 2,
  },
  addButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  storyCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4B6A',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  storyCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  username: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
    opacity: 0.9,
  },
}); 