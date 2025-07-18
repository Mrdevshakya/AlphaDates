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
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile, UserUpdateData } from '../../src/types';

interface AuthContextType {
  user: User | null;
  userData: UserProfile | null;
  setUserData: (userData: UserProfile | null) => void;
  loading: boolean;
  isFirstTime: boolean;
  setIsFirstLaunch: (value: boolean) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<User>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: UserUpdateData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(true);

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
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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

      // Update last login time
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp()
      });

      // Fetch updated user data
      await fetchUserData(user.uid);

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

      // Update display name if it was changed
      if (data.name) {
        await updateProfile(user, {
          displayName: data.name
        });
      }

      // Fetch updated user data
      await fetchUserData(user.uid);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      throw new Error('Failed to log out. Please try again.');
    }
  };

  const contextValue = {
    user,
    userData,
    setUserData,
    loading,
    isFirstTime,
    setIsFirstLaunch,
    signUp,
    signIn,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
