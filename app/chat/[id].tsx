import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import usePresence from '../hooks/usePresence';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ChatMessage, ChatParticipant } from '../../src/types';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const { user, refreshUnreadCount } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participant, setParticipant] = useState<ChatParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isParticipantOnline = usePresence(participant?.id);

  // Mark messages as read when chat is opened
  const markMessagesAsRead = async () => {
    if (!user || !id) return;
    
    try {
      // Get all messages in this chat room
      const messagesQuery = query(
        collection(db, 'chatRooms', id as string, 'messages'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(messagesQuery);
      
      if (!snapshot.empty) {
        // Use batch to update all unread messages sent by the other user
        const batch = writeBatch(db);
        let hasUnreadMessages = false;
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.senderId !== user.uid && data.read === false) {
            batch.update(doc.ref, { read: true });
            hasUnreadMessages = true;
          }
        });
        
        // Update the lastMessage in the chat room if it's unread
        const roomDoc = await getDoc(doc(db, 'chatRooms', id as string));
        if (roomDoc.exists()) {
          const roomData = roomDoc.data();
          if (roomData.lastMessage && 
              !roomData.lastMessage.read && 
              roomData.lastMessage.senderId !== user.uid) {
            batch.update(doc(db, 'chatRooms', id as string), {
              'lastMessage.read': true
            });
          }
        }
        
        // Only commit if there are changes to make
        if (hasUnreadMessages) {
          await batch.commit();
          
          // Refresh unread count after marking messages as read
          await refreshUnreadCount();
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    if (!user || !id) return;

    // First get the chat room to verify access
    const chatRoomRef = doc(db, 'chatRooms', id as string);
    const unsubscribeRoom = onSnapshot(chatRoomRef, async (roomSnapshot) => {
      if (!roomSnapshot.exists()) {
        console.error('Chat room not found');
        router.back();
        return;
      }

      const roomData = roomSnapshot.data();
      if (!roomData.participants.includes(user.uid)) {
        console.error('Not a participant of this chat');
        router.back();
        return;
      }

      // Get the other participant's info
      const otherParticipantId = roomData.participants.find((pid: string) => pid !== user.uid);
      if (otherParticipantId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setParticipant({
              id: otherParticipantId,
              name: userData.name || 'Anonymous',
              photo: userData.photos?.[0],
              online: false, // You would need a separate online status system
              lastSeen: userData.lastLoginAt,
            });
          }
        } catch (error) {
          console.error('Error fetching participant:', error);
        }
      }

      // Subscribe to messages
      const messagesQuery = query(
        collection(db, 'chatRooms', id as string, 'messages'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const newMessages: ChatMessage[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          newMessages.push({
            id: doc.id,
            text: data.text || '',
            image: data.image || null,
            senderId: data.senderId,
            receiverId: data.receiverId,
            createdAt: data.createdAt,
            read: data.read || false,
          } as ChatMessage);
        });
        setMessages(newMessages);
        setLoading(false);
      }, (error) => {
        console.error('Messages subscription error:', error);
        setLoading(false);
      });

      return () => {
        unsubscribeMessages();
      };
    }, (error) => {
      console.error('Chat room subscription error:', error);
      setLoading(false);
    });

    // Mark messages as read when the chat is opened
    markMessagesAsRead();

    return () => {
      unsubscribeRoom();
    };
  }, [id, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !id || !participant) return;

    try {
      setSending(true);
      const messageData: Partial<ChatMessage> = {
        text: newMessage.trim(),
        senderId: user.uid,
        receiverId: participant.id,
        createdAt: serverTimestamp(),
        read: false,
      };

      // Add message to chat room
      await addDoc(collection(db, 'chatRooms', id as string, 'messages'), messageData);

      // Update chat room's last message
      await updateDoc(doc(db, 'chatRooms', id as string), {
        lastMessage: messageData,
        updatedAt: serverTimestamp(),
      });

      setNewMessage('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && user && id) {
        setSending(true);
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const storageRef = ref(storage, `chats/${id}/images/${Date.now()}`);
        await uploadBytes(storageRef, blob);
        const imageUrl = await getDownloadURL(storageRef);
        
        const messageData: Partial<ChatMessage> = {
          image: imageUrl,
          senderId: user.uid,
          receiverId: participant?.id,
          createdAt: serverTimestamp(),
          read: false,
        };

        await addDoc(collection(db, 'chatRooms', id as string, 'messages'), messageData);
        await updateDoc(doc(db, 'chatRooms', id as string), {
          lastMessage: { ...messageData, text: '📷 Photo' },
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error sending image:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item: message }: { item: ChatMessage }) => {
    const isOwnMessage = message.senderId === user?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {message.image ? (
          <Image source={{ uri: message.image }} style={styles.messageImage} />
        ) : (
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.text}
          </Text>
        )}
        <Text style={[
          styles.messageTime,
          isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{participant?.name}</Text>
          <Text style={[
            styles.headerStatus,
            isParticipantOnline && styles.headerStatusOnline
          ]}>
            {isParticipantOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="call" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="videocam" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={styles.messagesList}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={handleImagePick}
        >
          <Ionicons name="image" size={24} color="#666" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />

        <TouchableOpacity 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const formatTime = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerStatus: {
    color: '#666',
    fontSize: 12,
  },
  headerStatusOnline: {
    color: '#4CAF50',
  },
  headerButton: {
    marginLeft: 16,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF4B6A',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: 'white',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  messageTime: {
    fontSize: 10,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
  },
  otherMessageTime: {
    color: '#666',
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    padding: 8,
    maxHeight: 100,
    color: 'white',
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#FF4B6A',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
}); 