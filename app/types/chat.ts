export type MessageType = 'text' | 'image' | 'voice' | 'video';

export interface User {
  id: string;
  name: string;
  image: string;
  isOnline: boolean;
  lastActive: string;
}

export interface LastMessage {
  text: string;
  timestamp: string;
  unread: boolean;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: LastMessage;
}

export interface MessageStatus {
  sent: boolean;
  delivered: boolean;
  read: boolean;
}

export interface Message {
  id: string;
  type: MessageType;
  content: string | any;
  timestamp: string;
  sender: string;
  receiver: string;
  reactions: string[];
  isLiked: boolean;
  status: MessageStatus;
  duration?: number;
  thumbnail?: string;
}

export interface VoiceMessage {
  duration: number;
  waveform: number[];
  url: string;
}

export interface VideoMessage {
  duration: number;
  thumbnail: string;
  url: string;
}

export interface TypingIndicator {
  userId: string;
  timestamp: number;
}

export interface ChatEncryption {
  keyPair: {
    publicKey: string;
    privateKey: string;
  };
  signingKeys: {
    publicKey: string;
    privateKey: string;
  };
  sharedKey?: string;
}

// Default export a dummy component to satisfy expo-router
export default function ChatTypes() {
  return null;
} 