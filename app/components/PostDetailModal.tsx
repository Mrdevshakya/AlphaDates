import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post as PostType, UserProfile } from '../../src/types';
import Post from './Post';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface PostDetailModalProps {
  visible: boolean;
  posts: Array<{ post: PostType; user: UserProfile }>;
  initialIndex: number;
  onClose: () => void;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
}

export default function PostDetailModal({
  visible,
  posts,
  initialIndex,
  onClose,
  onLike,
  onComment,
  onDeleteComment,
}: PostDetailModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  React.useEffect(() => {
    if (visible && initialIndex !== currentIndex) {
      setCurrentIndex(initialIndex);
      // Scroll to the initial post when modal opens
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialIndex]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderPost = ({ item, index }: { item: { post: PostType; user: UserProfile }; index: number }) => (
    <View style={styles.postContainer}>
      <Post
        post={item.post}
        user={item.user}
        onLike={onLike}
        onComment={onComment}
        onDeleteComment={onDeleteComment}
      />
    </View>
  );

  const handleClose = () => {
    onClose();
  };

  const getItemLayout = (data: any, index: number) => ({
    length: height,
    offset: height * index,
    index,
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <BlurView intensity={80} style={styles.headerBlur}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Posts</Text>
              <View style={styles.headerRight}>
                <Text style={styles.postCounter}>
                  {currentIndex + 1} of {posts.length}
                </Text>
              </View>
            </View>
          </BlurView>
        </SafeAreaView>

        {/* Posts List */}
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.post.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex}
          windowSize={3}
          maxToRenderPerBatch={2}
          removeClippedSubviews={true}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerBlur: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  postCounter: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  postContainer: {
    height: height,
    justifyContent: 'center',
    paddingTop: 100, // Account for header
  },
});
