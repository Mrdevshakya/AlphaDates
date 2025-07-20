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
    console.error('Error updating user presence:', error);
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