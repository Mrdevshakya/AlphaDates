import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  currentUser: null,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
});

// Storage keys
const USERS_STORAGE_KEY = '@amity_users';
const CURRENT_USER_KEY = '@amity_current_user';
const AUTH_DATA_KEY = '@amity_auth_data';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuthData();
  }, []);

  const loadStoredAuthData = async () => {
    try {
      const [userJson, authDataJson] = await Promise.all([
        AsyncStorage.getItem(CURRENT_USER_KEY),
        AsyncStorage.getItem(AUTH_DATA_KEY),
      ]);

      if (userJson && authDataJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Get existing users or initialize empty array
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];

      // Check if email already exists
      if (users.some(user => user.email === email)) {
        throw new Error('Email already registered');
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        createdAt: new Date().toISOString(),
      };

      // Add to users array
      users.push(newUser);

      // Store user data
      await Promise.all([
        AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)),
        AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser)),
        AsyncStorage.setItem(AUTH_DATA_KEY, JSON.stringify({ email, password })),
        AsyncStorage.setItem(`@amity_user_${newUser.id}`, JSON.stringify({
          ...newUser,
          password, // In a real app, this should be hashed
        })),
      ]);

      setCurrentUser(newUser);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (!usersJson) return false;

      const users: User[] = JSON.parse(usersJson);
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's stored data
      const userDataJson = await AsyncStorage.getItem(`@amity_user_${user.id}`);
      if (!userDataJson) {
        throw new Error('User data not found');
      }

      const userData = JSON.parse(userDataJson);
      if (userData.password !== password) {
        throw new Error('Invalid password');
      }

      // Update stored auth data
      await Promise.all([
        AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)),
        AsyncStorage.setItem(AUTH_DATA_KEY, JSON.stringify({ email, password })),
      ]);

      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CURRENT_USER_KEY),
        AsyncStorage.removeItem(AUTH_DATA_KEY),
      ]);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        register,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
