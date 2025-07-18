import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post as PostType, UserProfile } from '../../src/types';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const DOUBLE_TAP_DELAY = 300;

interface PostProps {
  post: PostType;
  user: UserProfile;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
}

export default function Post({ post, user, onLike, onComment }: PostProps) {
  const { user: currentUser } = useAuth();
  const [comment, setComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const lastTap = useRef<number>(0);
  const likeScale = useRef(new Animated.Value(0)).current;

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      if (!post.likes.includes(currentUser?.uid || '')) {
        handleLike();
        animateLike();
      }
    }
    lastTap.current = now;
  };

  const animateLike = () => {
    setShowLikeAnimation(true);
    Animated.sequence([
      Animated.spring(likeScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.spring(likeScale, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => setShowLikeAnimation(false));
  };

  const handleLike = () => {
    onLike(post.id);
  };

  const handleComment = () => {
    if (comment.trim()) {
      onComment(post.id, comment.trim());
      setComment('');
    }
  };

  const navigateToProfile = () => {
    router.push(`/profile/${user.id}`);
  };

  const renderMedia = ({ item }: { item: string }) => (
    <TouchableOpacity 
      activeOpacity={1} 
      onPress={handleDoubleTap}
      style={styles.mediaContainer}
    >
      <Image
        source={{ uri: item }}
        style={styles.media}
        resizeMode="cover"
      />
      {showLikeAnimation && (
        <Animated.View style={[
          styles.likeAnimation,
          {
            transform: [
              { scale: likeScale },
              { translateY: -20 },
            ],
          },
        ]}>
          <Ionicons name="heart" size={80} color="white" />
        </Animated.View>
      )}
    </TouchableOpacity>
  );

  const displayComments = showAllComments 
    ? post.comments 
    : post.comments.slice(0, 2);

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm';
    return Math.floor(seconds) + 's';
  };

  return (
    <BlurView intensity={10} tint="dark" style={styles.container}>
      {/* Post Header */}
      <TouchableOpacity style={styles.header} onPress={navigateToProfile}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#FF4B6A', '#FF8C9F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <Image
              source={{ 
                uri: user.profilePicture || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random` 
              }}
              style={styles.avatar}
            />
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{user.username}</Text>
            {post.location && (
              <Text style={styles.location}>{post.location}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Post Media */}
      <FlatList
        data={post.mediaUrls}
        renderItem={renderMedia}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${post.id}-media-${index}`}
      />

      {/* Post Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons 
              name={post.likes.includes(currentUser?.uid || '') ? "heart" : "heart-outline"} 
              size={28} 
              color={post.likes.includes(currentUser?.uid || '') ? "#FF4B6A" : "white"} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>
        {post.mediaUrls.length > 1 && (
          <View style={styles.mediaIndicator}>
            {post.mediaUrls.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.mediaIndicatorDot,
                  index === 0 && styles.mediaIndicatorDotActive,
                ]}
              />
            ))}
          </View>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <TouchableOpacity style={styles.likesContainer}>
        <Text style={styles.likes}>
          {post.likes.length.toLocaleString()} {post.likes.length === 1 ? 'like' : 'likes'}
        </Text>
      </TouchableOpacity>

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.caption}>{post.caption}</Text>
        </View>
      )}

      {/* Comments */}
      {post.comments.length > 0 && (
        <View style={styles.commentsContainer}>
          {post.comments.length > 2 && !showAllComments && (
            <TouchableOpacity onPress={() => setShowAllComments(true)}>
              <Text style={styles.viewComments}>
                View all {post.comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
          {displayComments.map((comment, index) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentUsername}>{comment.userId}</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {timeAgo(post.createdAt)}
      </Text>

      {/* Add Comment */}
      <View style={styles.addComment}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={comment}
          onChangeText={setComment}
          onSubmitEditing={handleComment}
        />
        {comment.length > 0 && (
          <TouchableOpacity onPress={handleComment}>
            <Text style={styles.postButton}>Post</Text>
          </TouchableOpacity>
        )}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: 'rgba(26,26,26,0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  location: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  mediaContainer: {
    width: width,
    height: width,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  likeAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  mediaIndicator: {
    flexDirection: 'row',
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -12 }],
  },
  mediaIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 2,
  },
  mediaIndicatorDotActive: {
    backgroundColor: '#FF4B6A',
  },
  likesContainer: {
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  likes: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  captionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  commentsContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  viewComments: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  commentUsername: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
  },
  commentText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  addComment: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    padding: 12,
  },
  commentInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },
  postButton: {
    color: '#FF4B6A',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
}); 