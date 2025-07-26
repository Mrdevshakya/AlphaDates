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

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  duration: number; // in months
  price: number; // in INR
  features: string[];
  isPopular?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentOrder {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'cancelled';
  cashfreeOrderId?: string;
  paymentSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Coupon Code Types
export interface CouponCode {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  applicablePlans: string[]; // empty array means all plans
  createdBy: string; // admin user ID
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  usedAt: Date;
}

// Checkout Types
export interface CheckoutData {
  planId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
  upiId?: string;
}

// UPI Payment Types
export interface UPIPayment {
  id: string;
  orderId: string;
  userId: string;
  upiId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  paymentReference?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Enhanced Payment Order
export interface EnhancedPaymentOrder extends PaymentOrder {
  couponCode?: string;
  discountAmount?: number;
  originalAmount?: number;
  upiId?: string;
  upiPayment?: UPIPayment;
}

// Extend UserProfile to include subscription info
export interface UserProfileWithSubscription extends UserProfile {
  subscription?: UserSubscription;
  hasActiveSubscription?: boolean;
}