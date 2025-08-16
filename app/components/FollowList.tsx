import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../../src/types';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FollowListProps {
  userIds: string[];
  onClose: () => void;
  title: string;
  currentUserId: string;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
  onRemoveFollower?: (userId: string) => void;
}

export default function FollowList({
  userIds,
  onClose,
  title,
  currentUserId,
  onFollowToggle,
  onRemoveFollower,
}: FollowListProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userIds || userIds.length === 0) {
          setUsers([]);
          return;
        }

        const usersData = await Promise.all(
          userIds.map(async (userId) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
              throw new Error(`User ${userId} not found`);
            }
            return { id: userDoc.id, ...userDoc.data() } as UserProfile;
          })
        );
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userIds]);

  const handleUnfollow = (userId: string, username: string) => {
    Alert.alert(
      'Unfollow User',
      `Are you sure you want to unfollow ${username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: () => onFollowToggle?.(userId, true),
        },
      ]
    );
  };

  const handleRemoveFollower = (userId: string, username: string) => {
    Alert.alert(
      'Remove Follower',
      `Are you sure you want to remove ${username} from your followers?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveFollower?.(userId),
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: UserProfile }) => {
    const isFollowing = item.followers?.includes(currentUserId);
    const isCurrentUser = item.id === currentUserId;
    const isFollowersTab = title === 'Followers';

    return (
      <TouchableOpacity style={styles.userItem}>
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userItemGradient}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ 
                  uri: item.profilePictureBase64 ? 
                    `data:image/jpeg;base64,${item.profilePictureBase64}` :
                    item.profilePicture || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random` 
                }}
                style={styles.avatar}
              />
              {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.userText}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.name}>{item.name}</Text>
              {item.bio && (
                <Text style={styles.bio} numberOfLines={1}>
                  {item.bio}
                </Text>
              )}
            </View>
          </View>
          {!isCurrentUser && (
            isFollowersTab ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.removeButton]}
                onPress={() => handleRemoveFollower(item.id, item.username)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.unfollowButton]}
                onPress={() => handleUnfollow(item.id, item.username)}
              >
                <Text style={styles.unfollowButtonText}>Unfollow</Text>
              </TouchableOpacity>
            )
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <BlurView intensity={100} tint="dark" style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4B6A" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={100} tint="dark" style={styles.container}>
      <LinearGradient
        colors={['rgba(255,75,106,0.1)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4B6A" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyText}>
            {title === 'Followers' ? 'No followers yet' : 'Not following anyone yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {title === 'Followers' 
              ? 'Share your profile to get more followers!'
              : 'Start following people to see them here!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.98)',
  },
  headerGradient: {
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  list: {
    padding: 16,
  },
  userItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  userItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FF4B6A',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  userText: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  name: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF4B6A',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FF4B6A',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF4B6A',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  unfollowButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF4B6A',
  },
  unfollowButtonText: {
    color: '#FF4B6A',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  removeButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
}); 