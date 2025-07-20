import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const usePresence = (userId: string | undefined) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const userStatusRef = doc(db, 'status', userId);
    const unsubscribe = onSnapshot(userStatusRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsOnline(data.state === 'online');
      } else {
        setIsOnline(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return isOnline;
};

export default usePresence; 