import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCeGIDwn5i0ILC3t2bH_-ydu6VJkYUPTXA",
  authDomain: "afnny-ed7bb.firebaseapp.com",
  projectId: "afnny-ed7bb",
  storageBucket: "afnny-ed7bb.appspot.com", // 🔄 FIXED this (was incorrect!)
  messagingSenderId: "252251272871",
  appId: "1:252251272871:web:be9a4c71fae4f8e3f04d82",
  measurementId: "G-5YY1PSEKF2"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app;
