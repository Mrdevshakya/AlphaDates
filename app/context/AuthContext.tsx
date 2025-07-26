import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile, UserUpdateData, UserSubscription } from '../../src/types';
import { SubscriptionService } from '../utils/subscription';
import { getUnreadMessagesCount } from '../utils/chat';
import { getUnreadNotificationsCount, subscribeToNotifications, NotificationWithUser } from '../utils/notifications';
import presence from '../utils/presence';
import { AppState } from 'react-native';

interface AuthContextType {
  user: User | null;
  userData: UserProfile | null;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  notifications: NotificationWithUser[];
  subscription: UserSubscription | null;
  hasActiveSubscription: boolean;
  setUserData: (userData: UserProfile | null) => void;
  loading: boolean;
  isFirstTime: boolean;
  setIsFirstLaunch: (value: boolean) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<User>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: UserUpdateData) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationWithUser[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch unread messages count
  const refreshUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await getUnreadMessagesCount(user.uid);
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
    }
  };

  // Fetch unread notifications count
  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const count = await getUnreadNotificationsCount(user.uid);
      setUnreadNotificationsCount(count);
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  };

  // Fetch subscription status
  const refreshSubscription = async () => {
    if (!user) return;
    try {
      console.log('🔍 Checking subscription for user:', user.uid);
      const userSubscription = await SubscriptionService.getUserSubscription(user.uid);
      const isActive = await SubscriptionService.hasActiveSubscription(user.uid);
      console.log('📊 Subscription data:', userSubscription);
      console.log('✅ Has active subscription:', isActive);
      setSubscription(userSubscription);
      setHasActiveSubscription(isActive);
    } catch (error) {
      console.error('❌ Error fetching subscription:', error);
      // For now, set to false to show subscription requirement
      setHasActiveSubscription(false);
    }
  };

  useEffect(() => {
    // Check if it's first launch
    AsyncStorage.getItem('hasLaunched')
      .then(value => {
        if (value === null) {
          AsyncStorage.setItem('hasLaunched', 'false');
          setIsFirstTime(true);
        } else {
          setIsFirstTime(false);
        }
      })
      .catch(err => {
        console.error('Error checking first launch:', err);
        setIsFirstTime(false);
      });

    // Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserData(user.uid);
        await refreshUnreadCount();
        await refreshNotifications();
        await refreshSubscription();
      } else {
        setUserData(null);
        setUnreadMessagesCount(0);
        setUnreadNotificationsCount(0);
        setNotifications([]);
        setSubscription(null);
        setHasActiveSubscription(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Set up chat rooms listener to update unread count
  useEffect(() => {
    if (!user) return;

    // Listen for changes in chat rooms where user is a participant
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async () => {
      // When chat rooms update, refresh the unread count
      await refreshUnreadCount();
    });

    return () => unsubscribe();
  }, [user]);

  // Set up notifications listener
  useEffect(() => {
    if (!user) return;

    // Subscribe to notifications
    const unsubscribe = subscribeToNotifications(user.uid, (updatedNotifications) => {
      setNotifications(updatedNotifications);
      
      // Update unread count
      const unreadCount = updatedNotifications.filter(item => !item.notification.read).length;
      setUnreadNotificationsCount(unreadCount);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle app state changes for presence
  useEffect(() => {
    if (!user) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        presence.updateUserPresence(user.uid, true);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        presence.updateUserPresence(user.uid, false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  // Set up presence sync on auth state change
  useEffect(() => {
    if (!user) return;

    const setupPresence = async () => {
      const cleanup = await presence.setupPresenceSync(user.uid);
      return cleanup;
    };

    const cleanupPresence = setupPresence();

    return () => {
      if (cleanupPresence) {
        cleanupPresence.then(cleanup => cleanup && cleanup());
      }
    };
  }, [user]);

  const setIsFirstLaunch = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('hasLaunched', String(!value));
      setIsFirstTime(value);
    } catch (err) {
      console.error('Error setting first launch:', err);
    }
  };

  const validateInput = (username: string, password: string) => {
    if (!username || !password) {
      throw new Error('Please fill in all fields.');
    }
    if (password.length < 6) {
      throw new Error('Password should be at least 6 characters long.');
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      if (!userData.username) {
        throw new Error('Username is required.');
      }

      // Check if username already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', userData.username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Username already taken. Please choose another one.');
      }

      validateInput(email, password);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Reserve username
      await setDoc(doc(db, 'usernames', userData.username), {
        uid: user.uid,
        createdAt: serverTimestamp()
      });

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        email,
        displayName: userData.name,
        createdAt: new Date().toISOString(),
        lastLoginAt: serverTimestamp(),
      });

      // Update display name if provided
      if (userData.name) {
        await updateProfile(user, {
          displayName: userData.name
        });
      }

      // Fetch updated user data
      await fetchUserData(user.uid);

      return user;
    } catch (error: any) {
      // If there's an error, clean up any created resources
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already in use. Please sign in or use a different email.');
      }
      console.error('Sign-up error:', error);
      throw new Error(error.message);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      validateInput(username, password);
      
      // Find user by username
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('No account found with this username. Please sign up.');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserProfile;
      
      // Sign in user with email and password
      const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
      const user = userCredential.user;

      // Update last login time and set online status
      await Promise.all([
        updateDoc(doc(db, 'users', user.uid), {
          lastLoginAt: serverTimestamp()
        }),
        presence.updateUserPresence(user.uid, true)
      ]);

      // Fetch updated user data
      await fetchUserData(user.uid);
      await refreshUnreadCount();
      await refreshNotifications();

    } catch (error: any) {
      console.error('Sign-in error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid username or password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else {
        throw new Error('Failed to sign in. Please try again.');
      }
    }
  };

  const updateUserProfile = async (data: UserUpdateData) => {
    if (!user) throw new Error('No user logged in');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      // Update local state
      if (userData) {
        setUserData({
          ...userData,
          ...data
        });
      }

      // Update display name if provided
      if (data.name) {
        await updateProfile(user, {
          displayName: data.name
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await presence.updateUserPresence(user.uid, false);
      }
      await signOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      unreadMessagesCount,
      unreadNotificationsCount,
      notifications,
      subscription,
      hasActiveSubscription,
      setUserData,
      loading,
      isFirstTime,
      setIsFirstLaunch,
      signUp,
      signIn,
      logout,
      updateUserProfile,
      refreshUnreadCount,
      refreshNotifications,
      refreshSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
