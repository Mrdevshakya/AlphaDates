import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc, updateDoc, Timestamp, getDocs, DocumentData, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { addDoc } from 'firebase/firestore';

export type NotificationType = 'like' | 'follow' | 'comment' | 'match' | 'suggestion';

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string; // ID of the user who triggered the notification
  targetUserId: string; // ID of the user who receives the notification
  contentId?: string; // ID of the post/video/comment
  contentType?: 'post' | 'video' | 'comment';
  message?: string;
  read: boolean;
  createdAt: Date;
}

export interface NotificationWithUser {
  notification: Notification;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  postImage?: string;
}

// Subscribe to real-time notifications
export const subscribeToNotifications = (
  userId: string,
  onNotificationsUpdate: (notifications: NotificationWithUser[]) => void
) => {
  // Create a query for notifications where the current user is the target
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('targetUserId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  // Set up real-time listener
  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const notificationsPromises = snapshot.docs.map(async (docSnapshot) => {
      const notificationData = docSnapshot.data();
      const notification: Notification = {
        id: docSnapshot.id,
        type: notificationData.type,
        userId: notificationData.userId,
        targetUserId: notificationData.targetUserId,
        contentId: notificationData.contentId,
        contentType: notificationData.contentType,
        message: notificationData.message,
        read: notificationData.read || false,
        createdAt: notificationData.createdAt?.toDate() || new Date(),
      };

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', notification.userId));
      const userData = userDoc.data() as DocumentData || {};

      // Get post image if applicable
      let postImage;
      if (notification.contentId && (notification.type === 'like' || notification.type === 'comment')) {
        try {
          const contentRef = doc(db, notification.contentType === 'video' ? 'videos' : 'posts', notification.contentId);
          const contentDoc = await getDoc(contentRef);
          const contentData = contentDoc.data() as DocumentData || {};
          postImage = contentData.imageUrl || contentData.thumbnailUrl;
        } catch (error) {
          console.error('Error fetching content image:', error);
        }
      }

      return {
        notification,
        user: {
          id: notification.userId,
          name: userData.name || 'Unknown User',
          username: userData.username || 'unknown',
          avatar: userData.profileImage || 'https://via.placeholder.com/150',
        },
        postImage,
      };
    });

    const notifications = await Promise.all(notificationsPromises);
    onNotificationsUpdate(notifications);
  });

  return unsubscribe;
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('targetUserId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true
  });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('targetUserId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnapshot) => {
    batch.update(docSnapshot.ref, { read: true });
  });

  await batch.commit();
};

// Create a notification
export const createNotification = async (
  type: NotificationType,
  userId: string, // who is creating the notification
  targetUserId: string, // who will receive the notification
  contentId?: string,
  contentType?: 'post' | 'video' | 'comment',
  message?: string
): Promise<void> => {
  // Don't create notification if user is notifying themselves
  if (userId === targetUserId) return;

  const notificationsRef = collection(db, 'notifications');
  
  // Check if a similar notification already exists (to prevent duplicates)
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('targetUserId', '==', targetUserId),
    where('type', '==', type),
    ...(contentId ? [where('contentId', '==', contentId)] : [])
  );

  const snapshot = await getDocs(q);
  
  // If similar notification exists and is less than 1 hour old, update it
  if (!snapshot.empty) {
    const existingNotification = snapshot.docs[0];
    const notificationData = existingNotification.data();
    const createdAt = notificationData.createdAt?.toDate() || new Date();
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (createdAt > hourAgo) {
      // Update existing notification
      await updateDoc(existingNotification.ref, {
        createdAt: Timestamp.now(),
        read: false,
        ...(message ? { message } : {})
      });
      return;
    }
  }

  // Create new notification with only defined fields
  const notificationData: any = {
    type,
    userId,
    targetUserId,
    read: false,
    createdAt: Timestamp.now()
  };

  // Only add optional fields if they are defined
  if (contentId) notificationData.contentId = contentId;
  if (contentType) notificationData.contentType = contentType;
  if (message) notificationData.message = message;

  await addDoc(collection(db, 'notifications'), notificationData);
}; 

// Delete specific notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await deleteDoc(notificationRef);
};

// Delete notifications by type and content
export const deleteNotificationsByContent = async (
  type: NotificationType,
  userId: string, // who created the notification
  targetUserId: string, // who received the notification
  contentId?: string
): Promise<void> => {
  const notificationsRef = collection(db, 'notifications');
  
  // Create query conditions
  const conditions = [
    where('type', '==', type),
    where('userId', '==', userId),
    where('targetUserId', '==', targetUserId)
  ];
  
  // Add contentId condition if provided
  if (contentId) {
    conditions.push(where('contentId', '==', contentId));
  }
  
  const q = query(notificationsRef, ...conditions);
  const snapshot = await getDocs(q);

  // Delete all matching notifications
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}; 

const NotificationUtils = {
  subscribeToNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  deleteNotification,
  deleteNotificationsByContent,
};

export default NotificationUtils; 