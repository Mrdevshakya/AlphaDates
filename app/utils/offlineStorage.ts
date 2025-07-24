import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { 
  enableIndexedDbPersistence, 
  disableNetwork, 
  enableNetwork,
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const OFFLINE_QUEUE_KEY = '@offline_queue';
const OFFLINE_DATA_KEY = '@offline_data';

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data?: any;
  timestamp: number;
}

interface OfflineData {
  [collection: string]: {
    [docId: string]: {
      data: any;
      timestamp: number;
    };
  };
}

// Enable offline persistence for Firestore
export const enableOfflinePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Offline persistence enabled');
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (error.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence.');
    }
    console.error('Error enabling offline persistence:', error);
  }
};

// Initialize network status monitoring
export const initializeNetworkMonitoring = () => {
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      enableNetwork(db).catch(console.error);
      processOfflineQueue().catch(console.error);
    } else {
      disableNetwork(db).catch(console.error);
    }
  });
};

// Get offline queue
const getOfflineQueue = async (): Promise<QueuedOperation[]> => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
};

// Save offline queue
const saveOfflineQueue = async (queue: QueuedOperation[]) => {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving offline queue:', error);
  }
};

// Add operation to offline queue
export const addToOfflineQueue = async (operation: Omit<QueuedOperation, 'id' | 'timestamp'>) => {
  try {
    const queue = await getOfflineQueue();
    const newOperation: QueuedOperation = {
      ...operation,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    queue.push(newOperation);
    await saveOfflineQueue(queue);
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
};

// Process offline queue when back online
const processOfflineQueue = async () => {
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return;

    const failedOperations: QueuedOperation[] = [];

    for (const operation of queue) {
      try {
        const docRef = operation.docId
          ? doc(db, operation.collection, operation.docId)
          : doc(collection(db, operation.collection));

        switch (operation.type) {
          case 'create':
            await setDoc(docRef, {
              ...operation.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            break;

          case 'update':
            await updateDoc(docRef, {
              ...operation.data,
              updatedAt: serverTimestamp(),
            });
            break;

          case 'delete':
            await deleteDoc(docRef);
            break;
        }
      } catch (error) {
        console.error(`Error processing operation ${operation.id}:`, error);
        failedOperations.push(operation);
      }
    }

    // Save failed operations back to queue
    await saveOfflineQueue(failedOperations);
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
};

// Save data for offline access
export const saveOfflineData = async (collection: string, docId: string, data: any) => {
  try {
    const offlineDataString = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    const offlineData: OfflineData = offlineDataString ? JSON.parse(offlineDataString) : {};

    if (!offlineData[collection]) {
      offlineData[collection] = {};
    }

    offlineData[collection][docId] = {
      data,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
  } catch (error) {
    console.error('Error saving offline data:', error);
  }
};

// Get offline data
export const getOfflineData = async (collection: string, docId: string) => {
  try {
    const offlineDataString = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    const offlineData: OfflineData = offlineDataString ? JSON.parse(offlineDataString) : {};

    return offlineData[collection]?.[docId]?.data || null;
  } catch (error) {
    console.error('Error getting offline data:', error);
    return null;
  }
};

// Clear offline data
export const clearOfflineData = async () => {
  try {
    await AsyncStorage.removeItem(OFFLINE_DATA_KEY);
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
};

// Get offline data size
export const getOfflineDataSize = async (): Promise<number> => {
  try {
    const offlineDataString = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    return offlineDataString ? new Blob([offlineDataString]).size : 0;
  } catch (error) {
    console.error('Error getting offline data size:', error);
    return 0;
  }
};

// Check if device is online
export const isOnline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return !!state.isConnected;
  } catch (error) {
    console.error('Error checking online status:', error);
    return false;
  }
};

// Default export for expo-router
export default {
  enableOfflinePersistence,
  initializeNetworkMonitoring,
  addToOfflineQueue,
  saveOfflineData,
  getOfflineData,
  clearOfflineData,
  getOfflineDataSize,
  isOnline,
}; 