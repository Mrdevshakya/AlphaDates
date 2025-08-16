import { db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const updateUserPresence = async (userId: string, isOnline: boolean) => {
  if (!userId) return;
  
  try {
    const userStatusRef = doc(db, 'status', userId);
    await setDoc(userStatusRef, {
      state: isOnline ? 'online' : 'offline',
      lastChanged: serverTimestamp(),
    });
  } catch (error) {
    // Check if it's a permission error (user might be signed out)
    if (error.code === 'permission-denied') {
      console.warn('Permission denied updating user presence - user may be signed out');
    } else {
      console.error('Error updating user presence:', error);
    }
    throw error; // Re-throw so caller can handle appropriately
  }
};

const setupPresenceSync = async (userId: string) => {
  if (!userId) return;

  try {
    // Set initial online status
    await updateUserPresence(userId, true);

    // Set up cleanup for when app is closed or loses focus
    const cleanup = () => {
      updateUserPresence(userId, false);
    };

    // Return cleanup function
    return cleanup;
  } catch (error) {
    console.error('Error setting up presence sync:', error);
  }
};

const presence = {
  updateUserPresence,
  setupPresenceSync,
};

export default presence; 