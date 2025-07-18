import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  Animated,
  ListRenderItem,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Stories from '../components/Stories';
import Post from '../components/Post';
import { Post as PostType, Story, UserProfile, User } from '../../src/types';
import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc, arrayUnion, DocumentData, Timestamp, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedFlatList = Animated.createAnimatedComponent<any>(FlatList);

interface PostWithUser {
  post: PostType;
  user: UserProfile;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [stories, setStories] = useState<Array<{story: Story; user: UserProfile}>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [indexBuildError, setIndexBuildError] = useState<string | null>(null);
  const [scrollY] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const renderItem: ListRenderItem<PostWithUser> = ({ item }) => (
    <Post
      post={item.post}
      user={item.user}
      onLike={handleLike}
      onComment={handleComment}
    />
  );

  const keyExtractor = (item: PostWithUser) => item.post.id;

  const fetchFeed = async () => {
    if (!user) return;

    try {
      setIndexBuildError(null);
      // Get user's following list
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data() as DocumentData | undefined;
      const following = userData?.following || [];

      // Fetch stories from the last 24 hours
      const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
      
      try {
        // Fetch user's own stories
        const userStoriesQuery = query(
          collection(db, 'stories'),
          where('userId', '==', user.uid),
          where('createdAt', '>', oneDayAgo),
          orderBy('createdAt', 'desc')
        );

        const userStoriesSnapshot = await getDocs(userStoriesQuery);
        const userStoriesData = userStoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as Story[];

        // Fetch stories for each followed user
        const followedStoriesData = await Promise.all(
          following.map(async (followedId: string) => {
            const followedStoriesQuery = query(
              collection(db, 'stories'),
              where('userId', '==', followedId),
              where('createdAt', '>', oneDayAgo),
              orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(followedStoriesQuery);
            return snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt.toDate()
            })) as Story[];
          })
        );

        // Combine and flatten all stories
        const allStories = [...userStoriesData, ...followedStoriesData.flat()];

        // Fetch user data for stories
        const storiesWithUsers = await Promise.all(
          allStories.map(async (story) => {
            const userDocRef = doc(db, 'users', story.userId);
            const userDocSnap = await getDoc(userDocRef);
            const userData = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
            return { story, user: userData };
          })
        );

        setStories(storiesWithUsers);
      } catch (error: any) {
        if (error?.message?.includes('index')) {
          const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
          setIndexBuildError(indexUrl || 'Waiting for database indexes to build...');
        }
        console.error('Error fetching stories:', error);
      }

      try {
        // Fetch posts similarly
        const userPostsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const userPostsSnapshot = await getDocs(userPostsQuery);
        const userPostsData = userPostsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as PostType[];

        // Fetch posts for each followed user
        const followedPostsData = await Promise.all(
          following.map(async (followedId: string) => {
            const followedPostsQuery = query(
              collection(db, 'posts'),
              where('userId', '==', followedId),
              orderBy('createdAt', 'desc'),
              limit(10)
            );
            const snapshot = await getDocs(followedPostsQuery);
            return snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt.toDate()
            })) as PostType[];
          })
        );

        // Combine and sort all posts by date
        const allPosts = [...userPostsData, ...followedPostsData.flat()]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Fetch user data for posts
        const postsWithUsers = await Promise.all(
          allPosts.map(async (post) => {
            const userDocRef = doc(db, 'users', post.userId);
            const userDocSnap = await getDoc(userDocRef);
            const userData = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
            return { post, user: userData };
          })
        );

        setPosts(postsWithUsers);
      } catch (error: any) {
        if (error?.message?.includes('index')) {
          const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
          setIndexBuildError(indexUrl || 'Waiting for database indexes to build...');
        }
        console.error('Error fetching posts:', error);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: arrayUnion(user.uid)
      });
      
      // Update local state
      setPosts(currentPosts => 
        currentPosts.map(item => 
          item.post.id === postId
            ? {
                ...item,
                post: {
                  ...item.post,
                  likes: [...item.post.likes, user.uid]
                }
              }
            : item
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    if (!user) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        id: Date.now().toString(),
        userId: user.uid,
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
                  comments: [...item.post.comments, newComment]
                }
              }
            : item
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleStoryPress = (storyId: string) => {
    // Navigate to story viewer
    // This will be implemented later
    console.log('View story:', storyId);
  };

  const renderHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    const unreadNotifications = (user as User)?.userData?.unreadNotifications || 0;
    const unreadMessages = (user as User)?.userData?.unreadMessages || 0;

    return (
      <Animated.View style={[
        styles.header,
        { opacity: headerOpacity, paddingTop: insets.top }
      ]}>
        <BlurView intensity={30} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>AFNNY</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="heart-outline" size={24} color="white" />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="chatbubble-outline" size={24} color="white" />
                {unreadMessages > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color="#666" />
      <Text style={styles.emptyText}>No posts yet</Text>
      <Text style={styles.emptySubtext}>
        Follow more people to see their posts here
      </Text>
      <TouchableOpacity style={styles.exploreButton}>
        <LinearGradient
          colors={['#FF4B6A', '#FF8C9F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Text style={styles.exploreButtonText}>Explore People</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator color="#FF4B6A" />
        </View>
      );
    }
    return null;
  };

  if (loading && !posts.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6A" />
      </View>
    );
  }

  if (indexBuildError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF4B6A" />
        <Text style={styles.errorText}>
          Please wait while we set up the database...
        </Text>
        {indexBuildError.startsWith('http') && (
          <TouchableOpacity 
            onPress={() => Linking.openURL(indexBuildError)}
            style={styles.linkButton}
          >
            <LinearGradient
              colors={['#FF4B6A', '#FF8C9F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.linkText}>Check Progress</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={handleRefresh}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}
      <AnimatedFlatList
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={() => (
          <Stories
            stories={stories}
            onStoryPress={handleStoryPress}
          />
        )}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF4B6A"
            colors={['#FF4B6A']}
            progressBackgroundColor="#1a1a1a"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4B6A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
  },
  linkButton: {
    width: '60%',
    marginBottom: 10,
  },
  gradientButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  linkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  exploreButton: {
    width: '80%',
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
  },
});
