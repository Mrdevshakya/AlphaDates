import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChatRoom, ChatMessage, ChatParticipant } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import usePresence from '../hooks/usePresence';

export default function ChatScreen() {
  const { user, userData } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [participants, setParticipants] = useState<Record<string, ChatParticipant>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    // Subscribe to chat rooms - using only participants filter for now
    const chatRoomsQuery = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatRoomsQuery, async (snapshot) => {
      try {
        const rooms: ChatRoom[] = [];
        const participantIds = new Set<string>();

        // Get all rooms and sort them in memory
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const room = {
            id: doc.id,
            participants: data.participants || [],
            lastMessage: data.lastMessage || null,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          } as ChatRoom;
          rooms.push(room);
          room.participants.forEach(id => {
            if (id !== user.uid) participantIds.add(id);
          });
        });

        // Sort rooms by updatedAt in memory
        rooms.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis() || 0;
          const timeB = b.updatedAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setChatRooms(rooms);

        // Fetch participants' info
        const participantsData: Record<string, ChatParticipant> = {};
        const participantsPromises = Array.from(participantIds).map(async (id) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', id));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('User data for participant:', id, userData);
              
              // Try multiple photo sources
              let photoUrl = null;
              if (userData.profilePictureBase64) {
                photoUrl = `data:image/jpeg;base64,${userData.profilePictureBase64}`;
              } else if (userData.profilePicture) {
                photoUrl = userData.profilePicture;
              } else if (userData.photos && userData.photos.length > 0) {
                photoUrl = userData.photos[0];
              } else if (userData.profilePhoto) {
                photoUrl = userData.profilePhoto;
              }
              
              console.log('Profile photo URL for', userData.name, ':', photoUrl);
              
              participantsData[id] = {
                id,
                name: userData.name || userData.displayName || 'Anonymous',
                photo: photoUrl,
                online: false, // You would need a separate online status system
                lastSeen: userData.lastLoginAt,
              };
            }
          } catch (error) {
            console.error('Error fetching participant:', error);
          }
        });

        await Promise.all(participantsPromises);
        setParticipants(participantsData);
      } catch (error) {
        console.error('Error processing chat rooms:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Chat rooms subscription error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Add your refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleChatPress = (chatRoom: ChatRoom) => {
    const otherParticipantId = chatRoom.participants.find(id => id !== user?.uid);
    if (!otherParticipantId) return;

    router.push({
      pathname: '/chats/chat/[id]',
      params: { id: chatRoom.id }
    });
  };

  const getParticipantInfo = (chatRoom: ChatRoom): ChatParticipant | undefined => {
    const otherParticipantId = chatRoom.participants.find(id => id !== user?.uid);
    return otherParticipantId ? participants[otherParticipantId] : undefined;
  };

  const ChatListItem = ({ chatRoom, participant, onPress }: { 
    chatRoom: ChatRoom; 
    participant: ChatParticipant | undefined;
    onPress: () => void;
  }) => {
    const { user } = useAuth();
    const isOnline = usePresence(participant?.id);
    
    if (!participant) return null;

    const lastMessage = chatRoom.lastMessage;
    const isUnread = lastMessage && !lastMessage.read && lastMessage.senderId !== user?.uid;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={onPress}
      >
        <View style={styles.avatarContainer}>
          {participant.photo ? (
            <Image 
              source={{ uri: participant.photo }} 
              style={styles.avatar}
              onError={(error) => console.log('Chat list image load error:', error)}
              onLoad={() => console.log('Chat list image loaded:', participant.photo)}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{participant.name[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{participant.name}</Text>
            {lastMessage && (
              <Text style={styles.timestamp}>
                {formatTimestamp(lastMessage.createdAt)}
              </Text>
            )}
          </View>

          <View style={styles.lastMessage}>
            <Text 
              style={[
                styles.messageText,
                isUnread && styles.unreadText
              ]}
              numberOfLines={1}
            >
              {lastMessage?.text}
            </Text>
            {isUnread && <View style={styles.unreadIndicator} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderChatRoom = ({ item: chatRoom }: { item: ChatRoom }) => {
    const participant = getParticipantInfo(chatRoom);
    
    return (
      <ChatListItem
        chatRoom={chatRoom}
        participant={participant}
        onPress={() => handleChatPress(chatRoom)}
      />
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#666" />
      <Text style={styles.emptyText}>No conversations yet</Text>
      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => router.push('/explore')}
      >
        <Text style={styles.startButtonText}>Start Matching</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={chatRooms.filter(room => {
          const participant = getParticipantInfo(room);
          return participant?.name.toLowerCase().includes(searchQuery.toLowerCase());
        })}
        renderItem={renderChatRoom}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF4B6A"
          />
        }
        ListEmptyComponent={renderEmptyComponent}
      />


    </View>
  );
}

const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return '';

  const date = timestamp.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    padding: 0,
    marginLeft: 8,
  },
  chatList: {
    paddingTop: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF4B6A',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  lastMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    color: '#999',
    fontSize: 14,
    flex: 1,
  },
  unreadText: {
    color: 'white',
    fontWeight: '600',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4B6A',
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#FF4B6A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

});
