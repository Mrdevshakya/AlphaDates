import { User as FirebaseUser } from 'firebase/auth';

export interface User extends FirebaseUser {
  userData?: {
    unreadNotifications?: number;
    unreadMessages?: number;
  };
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  createdAt: Date;
  seenBy: string[];
  type: 'image' | 'video';
  duration?: number; // for videos
}

export interface Post {
  id: string;
  userId: string;
  caption: string;
  mediaUrls: string[];
  type: 'image' | 'video';
  likes: string[];
  comments: Comment[];
  createdAt: Date;
  location?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  likes: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  displayName: string;
  profilePicture: string;
  mobileNumber?: string;
  bio?: string;
  location?: string;
  age?: number;
  followers: string[];
  following: string[];
  posts: string[];
  photos: string[];
  interests?: string[];
  education?: string;
  work?: string;
  height?: string;
  zodiac?: string;
  drinking?: string;
  smoking?: string;
  lookingFor?: string;
  children?: string;
  pets?: string;
  personality?: string[];
  languages?: string[];
  isPrivate?: boolean;
  isOnline?: boolean;
  lastActive?: Date;
  createdAt: Date;
  lastLoginAt: Date;
  // Settings
  notificationSettings?: {
    likes?: boolean;
    comments?: boolean;
    follows?: boolean;
    messages?: boolean;
    matchUpdates?: boolean;
    appUpdates?: boolean;
  };
  securitySettings?: {
    twoFactorEnabled?: boolean;
    biometricEnabled?: boolean;
    locationEnabled?: boolean;
  };
  privacySettings?: {
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
  };
}

export interface UserUpdateData extends Partial<UserProfile> {}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  image?: string;
  createdAt: any; // Firebase Timestamp
  read: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

export interface ChatParticipant {
  id: string;
  name: string;
  photo?: string;
  online: boolean;
  lastSeen?: any; // Firebase Timestamp
} 