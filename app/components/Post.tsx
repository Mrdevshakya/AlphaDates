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
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { Post as PostType, UserProfile } from '../../src/types';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { createNotification, deleteNotificationsByContent } from '../utils/notifications';

const { width } = Dimensions.get('window');
const DOUBLE_TAP_DELAY = 300;

interface PostProps {
  post: PostType;
  user: UserProfile;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
}

export default function Post({ post, user, onLike, onComment, onDeleteComment }: PostProps) {
  const { user: currentUser } = useAuth();
  const [comment, setComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const lastTap = useRef<number>(0);
  const likeScale = useRef(new Animated.Value(0)).current;

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Only show animation and like if post is not already liked
      if (currentUser && !(post.likes || []).includes(currentUser.uid)) {
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

  const handleLike = async () => {
    if (!currentUser) return;
    
    // Check current like status BEFORE toggling
    const isCurrentlyLiked = (post.likes || []).includes(currentUser.uid);
    
    // Call the parent's onLike function to toggle the like
    onLike(post.id);
    
    // Handle notifications based on the PREVIOUS state
    if (isCurrentlyLiked) {
      // Post was liked, now being unliked - delete notification
      try {
        await deleteNotificationsByContent(
          'like',
          currentUser.uid,
          user.id,
          post.id
        );
      } catch (error) {
        console.error('Error deleting like notification:', error);
      }
    } else {
      // Post was not liked, now being liked - create notification
      if (user.id !== currentUser.uid) {
        try {
          await createNotification(
            'like',
            currentUser.uid,
            user.id,
            post.id,
            'post'
          );
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
    }
  };

  const handleComment = async () => {
    if (comment.trim()) {
      onComment(post.id, comment.trim());
      
      // Create notification for comment
      if (currentUser && user.id !== currentUser.uid) {
        try {
          await createNotification(
            'comment',
            currentUser.uid,
            user.id,
            post.id,
            'post',
            comment.trim()
          );
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
      
      setComment('');
    }
  };

  const handleDeleteComment = (commentId: string, commentUserId: string) => {
    // Only allow users to delete their own comments
    if (currentUser?.uid !== commentUserId) {
      Alert.alert('Error', 'You can only delete your own comments');
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteComment) {
              onDeleteComment(post.id, commentId);
            }
          },
        },
      ]
    );
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
      {post.mediaType === 'video' ? (
        <Video
          source={{ uri: item }}
          style={styles.media}
          resizeMode="cover"
          useNativeControls
          shouldPlay={false}
          isLooping
        />
      ) : (
        <Image
          source={{ uri: item }}
          style={styles.media}
          resizeMode="cover"
        />
      )}
      {showLikeAnimation && post.mediaType !== 'video' && (
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
    ? (post.comments || []) 
    : (post.comments || []).slice(0, 2);

  const timeAgo = (date: any) => {
    if (!date) return 'now';
    
    // Handle Firestore timestamp
    let dateObj: Date;
    if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return 'now';
    }
    
    // Check if dateObj is valid
    if (isNaN(dateObj.getTime())) {
      return 'now';
    }
    
    const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
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
                uri: user.profilePictureBase64 ? 
                  `data:image/jpeg;base64,${user.profilePictureBase64}` :
                  user.profilePicture || 
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
        data={
          post.imageBase64
            ? [post.imageBase64]
            : post.imageUrl
            ? [post.imageUrl]
            : post.mediaUrl
            ? [post.mediaUrl]
            : post.videoUrl
            ? [post.videoUrl]
            : (post.mediaUrls || [])
        }
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
              name={(post.likes || []).includes(currentUser?.uid || '') ? "heart" : "heart-outline"} 
              size={28} 
              color={(post.likes || []).includes(currentUser?.uid || '') ? "#FF4B6A" : "white"} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowCommentsModal(true)}>
            <Ionicons name="chatbubble-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>
        {(post.mediaUrls || []).length > 1 && (
          <View style={styles.mediaIndicator}>
            {(post.mediaUrls || []).map((_, index) => (
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
      </View>

      {/* Likes */}
      <TouchableOpacity style={styles.likesContainer}>
        <Text style={styles.likes}>
          {(post.likes || []).length.toLocaleString()} {(post.likes || []).length === 1 ? 'like' : 'likes'}
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
      {(post.comments || []).length > 0 && (
        <View style={styles.commentsContainer}>
          {(post.comments || []).length > 2 && !showAllComments && (
            <TouchableOpacity onPress={() => setShowAllComments(true)}>
              <Text style={styles.viewComments}>
                View all {(post.comments || []).length} comments
              </Text>
            </TouchableOpacity>
          )}
          {displayComments.map((comment, index) => (
            <TouchableOpacity 
              key={comment.id} 
              style={styles.commentItem}
              onLongPress={() => handleDeleteComment(comment.id, comment.userId)}
              delayLongPress={500}
            >
              <Text style={styles.commentUsername}>{comment.username || comment.userId}</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
              {currentUser?.uid === comment.userId && (
                <Text style={styles.inlineDeleteHint}>Long press to delete</Text>
              )}
            </TouchableOpacity>
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
        />
        <TouchableOpacity 
          style={[styles.postButton, !comment.trim() && styles.postButtonDisabled]} 
          onPress={handleComment}
          disabled={!comment.trim()}
        >
          <Text style={[styles.postButtonText, !comment.trim() && styles.postButtonTextDisabled]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Comments List */}
          <ScrollView style={styles.modalCommentsContainer}>
            {(post.comments || []).length === 0 ? (
              <View style={styles.noCommentsContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#666" />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
              </View>
            ) : (
              (post.comments || []).map((comment, index) => (
                <TouchableOpacity 
                  key={comment.id || index} 
                  style={styles.modalCommentItem}
                  onLongPress={() => handleDeleteComment(comment.id, comment.userId)}
                  delayLongPress={500}
                >
                  <View style={styles.modalCommentHeader}>
                    <LinearGradient
                      colors={['#FF4B6A', '#FF8C9F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalCommentAvatar}
                    >
                      <Text style={styles.modalCommentAvatarText}>
                        {(comment.username || comment.userId || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                    <View style={styles.modalCommentContent}>
                      <Text style={styles.modalCommentUsername}>{comment.username || comment.userId}</Text>
                      <Text style={styles.modalCommentText}>{comment.text}</Text>
                      {currentUser?.uid === comment.userId && (
                        <Text style={styles.deleteHint}>Long press to delete</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Add Comment Input */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalAddCommentContainer}
          >
            <View style={styles.modalAddComment}>
              <TextInput
                style={styles.modalCommentInput}
                placeholder="Add a comment..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.modalPostButton, !comment.trim() && styles.modalPostButtonDisabled]} 
                onPress={() => {
                  if (comment.trim()) {
                    handleComment();
                  }
                }}
                disabled={!comment.trim()}
              >
                <Text style={[styles.modalPostButtonText, !comment.trim() && styles.modalPostButtonTextDisabled]}>
                  Post
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#FF4B6A',
  },
  postButtonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
    backgroundColor: '#000',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCommentsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noCommentsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  noCommentsSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 4,
  },
  modalCommentItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalCommentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalCommentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalCommentAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCommentContent: {
    flex: 1,
  },
  modalCommentUsername: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalCommentText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
  },
  modalAddCommentContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    backgroundColor: '#000',
  },
  modalAddComment: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  modalCommentInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginRight: 12,
  },
  modalPostButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF4B6A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPostButtonDisabled: {
    backgroundColor: 'rgba(255,75,106,0.3)',
  },
  modalPostButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalPostButtonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  deleteHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  inlineDeleteHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 1,
  },
}); 