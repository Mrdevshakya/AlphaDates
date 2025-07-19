import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';
import { router } from 'expo-router';
import { markNotificationAsRead, markAllNotificationsAsRead, NotificationWithUser, NotificationType } from './utils/notifications';
import { formatDistanceToNow } from 'date-fns';

// Filter types
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'like', label: 'Likes' },
  { id: 'follow', label: 'Follows' },
  { id: 'comment', label: 'Comments' },
  { id: 'match', label: 'Matches' },
  { id: 'suggestion', label: 'Suggestions' },
];

export default function NotificationsScreen() {
  const { user, notifications, refreshNotifications } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const markAllAsRead = async () => {
      if (user) {
        try {
          await markAllNotificationsAsRead(user.uid);
          await refreshNotifications();
        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
      }
    };

    markAllAsRead();
  }, [user]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notification: NotificationWithUser) => {
    try {
      // Mark as read
      await markNotificationAsRead(notification.notification.id);
      
      // Navigate based on notification type
      switch (notification.notification.type) {
        case 'like':
        case 'comment':
          if (notification.notification.contentId) {
            // Navigate to post or video
            if (notification.notification.contentType === 'post') {
              router.push(`/post/${notification.notification.contentId}`);
            } else if (notification.notification.contentType === 'video') {
              router.push(`/video/${notification.notification.contentId}`);
            }
          }
          break;
        case 'follow':
          // Navigate to user profile
          router.push(`/profile/${notification.user.id}`);
          break;
        case 'match':
          // Navigate to matches screen
          router.push('/matches');
          break;
        case 'suggestion':
          // Navigate to user profile
          router.push(`/profile/${notification.user.id}`);
          break;
      }

      // Refresh notifications to update read status
      await refreshNotifications();
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(item => item.notification.type === activeFilter as NotificationType);

  const formatTimeAgo = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationWithUser }) => {
    const getIconName = () => {
      switch (item.notification.type) {
        case 'like': return 'heart';
        case 'follow': return 'person-add';
        case 'comment': return 'chatbubble';
        case 'match': return 'heart';
        case 'suggestion': return 'person';
        default: return 'notifications';
      }
    };

    const getIconColor = () => {
      switch (item.notification.type) {
        case 'like': return '#FF4B6A';
        case 'follow': return '#0095F6';
        case 'comment': return '#8A2BE2';
        case 'match': return '#FF4B6A';
        case 'suggestion': return '#4CAF50';
        default: return '#FF4B6A';
      }
    };

    const getNotificationContent = () => {
      switch (item.notification.type) {
        case 'like':
          return item.notification.contentType === 'video' 
            ? 'liked your video' 
            : 'liked your post';
        case 'follow':
          return 'started following you';
        case 'comment':
          return `commented: ${item.notification.message || ''}`;
        case 'match':
          return 'is a new match!';
        case 'suggestion':
          return 'suggested for you';
        default:
          return '';
      }
    };

    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          !item.notification.read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.notificationIcon, { backgroundColor: getIconColor() }]}>
          <Ionicons name={getIconName()} size={20} color="#FFF" />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.userInfo}>
            <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
            <View style={styles.textContainer}>
              <Text style={styles.notificationText}>
                <Text style={styles.username}>{item.user.name}</Text> {getNotificationContent()}
              </Text>
              <Text style={styles.timeText}>{formatTimeAgo(item.notification.createdAt)}</Text>
            </View>
          </View>
          {item.postImage && (
            <Image source={{ uri: item.postImage }} style={styles.postImage} />
          )}
          {item.notification.type === 'follow' || item.notification.type === 'suggestion' ? (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/profile/${item.user.id}`)}
            >
              <Text style={styles.actionButtonText}>
                {item.notification.type === 'follow' ? 'Follow Back' : 'Follow'}
              </Text>
            </TouchableOpacity>
          ) : null}
          {item.notification.type === 'match' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/chat/${item.user.id}`)}
            >
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === item.id && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(item.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item.id && styles.activeFilterText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.notification.id}
        contentContainerStyle={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              You don't have any {activeFilter !== 'all' ? activeFilter : ''} notifications yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filtersContent: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#FF4B6A',
  },
  filterText: {
    color: '#999',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#FFF',
  },
  notificationsList: {
    padding: 15,
  },
  notificationItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF4B6A',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF4B6A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 4,
  },
  username: {
    fontWeight: '700',
  },
  comment: {
    fontStyle: 'italic',
    color: '#CCC',
  },
  timeText: {
    color: '#999',
    fontSize: 12,
  },
  postImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    position: 'absolute',
    right: 0,
    top: 10,
  },
  actionButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});