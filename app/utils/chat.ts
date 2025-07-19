import { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp, collectionGroup, Timestamp, documentId } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChatRoom } from '../../src/types';

export async function createOrGetChatRoom(userId1: string, userId2: string): Promise<string> {
  try {
    // Prevent self-messaging
    if (userId1 === userId2) {
      throw new Error("Cannot create chat room with yourself");
    }

    // Check if chat room already exists
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', userId1)
    );

    const querySnapshot = await getDocs(q);
    const existingRoom = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(userId2);
    });

    if (existingRoom) {
      return existingRoom.id;
    }

    // Create new chat room if it doesn't exist
    const newRoomData: Partial<ChatRoom> = {
      participants: [userId1, userId2],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const newRoomRef = await addDoc(chatRoomsRef, newRoomData);
    return newRoomRef.id;
  } catch (error) {
    console.error('Error creating/getting chat room:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Get the count of unread messages for a user across all chat rooms
 * @param userId The ID of the user
 * @returns The count of unread messages
 */
export async function getUnreadMessagesCount(userId: string): Promise<number> {
  try {
    // Get all chat rooms where the user is a participant
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    let unreadCount = 0;
    
    // For each chat room, check if the last message is unread and not sent by the user
    for (const roomDoc of querySnapshot.docs) {
      const roomData = roomDoc.data();
      const lastMessage = roomData.lastMessage;
      
      if (lastMessage && 
          !lastMessage.read && 
          lastMessage.senderId !== userId) {
        unreadCount++;
      }
    }
    
    return unreadCount;
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    return 0;
  }
}

// Default export for expo-router
export default function ChatUtils() {
  return null;
} 