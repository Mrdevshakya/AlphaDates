import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Story, UserProfile } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const PROGRESS_BAR_WIDTH = width - 40;

export default function StoryViewer() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [storyUser, setStoryUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video | null>(null);

  useEffect(() => {
    const loadStory = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        const storyDoc = await getDoc(doc(db, 'stories', id));
        if (!storyDoc.exists()) {
          router.back();
          return;
        }

        const storyData = { id: storyDoc.id, ...storyDoc.data() } as Story;
        setStory(storyData);

        // Load story creator's profile
        const userDoc = await getDoc(doc(db, 'users', storyData.userId));
        if (userDoc.exists()) {
          setStoryUser({ id: userDoc.id, ...userDoc.data() } as UserProfile);
        }

        // Mark story as seen
        if (user && !storyData.seenBy.includes(user.uid)) {
          await updateDoc(doc(db, 'stories', id), {
            seenBy: arrayUnion(user.uid)
          });
        }

        setLoading(false);

        // Start progress animation
        Animated.timing(progress, {
          toValue: 1,
          duration: storyData.duration ? storyData.duration * 1000 : 5000,
          useNativeDriver: false,
        }).start(() => {
          router.back();
        });
      } catch (error) {
        console.error('Error loading story:', error);
        router.back();
      }
    };

    loadStory();

    return () => {
      progress.setValue(0);
    };
  }, [id, user]);

  const handleClose = () => {
    router.back();
  };

  if (loading || !story || !storyUser) {
    return (
      <View style={styles.container}>
        <BlurView intensity={100} tint="dark" style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4B6A" />
        </BlurView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, PROGRESS_BAR_WIDTH],
              }),
            },
          ]} 
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: storyUser.profilePicture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(storyUser.name)}&background=random`,
            }}
            style={styles.avatar}
          />
          <View style={styles.userTextInfo}>
            <Text style={styles.username}>{storyUser.username}</Text>
            <Text style={styles.timestamp}>Just now</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Story Content */}
      <View style={styles.content}>
        {story.type === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: story.mediaUrl }}
            style={styles.media}
            resizeMode="contain"
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                router.back();
              }
            }}
          />
        ) : (
          <Image
            source={{ uri: story.mediaUrl }}
            style={styles.media}
            resizeMode="contain"
          />
        )}
      </View>
    </View>
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
  },
  progressContainer: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    marginHorizontal: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF4B6A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  userTextInfo: {
    justifyContent: 'center',
  },
  username: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
}); 