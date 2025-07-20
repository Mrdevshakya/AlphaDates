# AFNNY - Modern Dating App

AFNNY is a sophisticated dating application built with React Native and Expo, designed to help users find meaningful connections through a beautiful and intuitive interface. The app features a dark-themed UI with modern design elements and real-time capabilities.

## 🌟 Key Features

### Authentication & Security
- Secure email and username-based authentication
- Password validation and security checks
- User presence tracking (online/offline status)
- Session management with AsyncStorage
- First-time user onboarding flow

### Profile Management
- Detailed user profiles with photos
- Profile editing capabilities
- Privacy settings
- Account security settings
- Notification preferences
- Help and support access

### Real-time Chat
- End-to-end encrypted messaging (using expo-crypto)
- Real-time message delivery
- Unread message indicators
- Message timestamps
- Chat room management
- Online status indicators
- Message search functionality
- Last seen tracking

### Matching System
- Interest-based matching
- Location-based matching
- Match exploration
- Match recommendations
- Story sharing
- Follow/Following system

### Notifications
- Real-time push notifications
- Unread message counts
- Match notifications
- System notifications
- Customizable notification settings

## 🛠️ Technical Stack

### Frontend
- React Native
- Expo (SDK Latest)
- TypeScript
- Expo Router for navigation
- Linear Gradient for UI effects
- Expo Icons
- Expo Blur for UI effects
- AsyncStorage for local storage

### Backend & Services
- Firebase Authentication
- Firebase Firestore
- Firebase Cloud Functions
- Real-time data synchronization
- Presence system
- End-to-end encryption

## 📁 Project Structure

```
afnny-missmatch/
├── app/                      # Main application code
│   ├── (auth)/              # Authentication screens
│   │   ├── sign-in.tsx      # Sign in screen
│   │   └── sign-up.tsx      # Sign up screen
│   ├── (tabs)/              # Main tab screens
│   │   ├── chat.tsx         # Chat list screen
│   │   ├── explore.tsx      # Match exploration
│   │   ├── home.tsx         # Home feed
│   │   ├── matches.tsx      # Matches list
│   │   └── profile/         # Profile section
│   │       ├── edit.tsx     # Profile editing
│   │       ├── index.tsx    # Profile view
│   │       └── settings/    # User settings
│   ├── chat/                # Chat functionality
│   │   └── [id].tsx         # Individual chat screen
│   ├── components/          # Reusable components
│   │   ├── FollowList.tsx   # Following/Followers list
│   │   ├── Post.tsx         # Post component
│   │   ├── Stories.tsx      # Stories component
│   │   └── UserProfileModal # User profile modal
│   ├── config/              # Configuration files
│   │   └── firebase.ts      # Firebase configuration
│   ├── context/             # React Context providers
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/               # Custom React hooks
│   │   └── usePresence.ts   # Online presence hook
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
│       ├── chat.ts          # Chat utilities
│       ├── encryption.ts    # E2E encryption
│       ├── notifications.ts # Notification handling
│       └── presence.ts      # Online presence system
├── assets/                  # Static assets
│   ├── fonts/              # Custom fonts
│   └── images/             # Image assets
└── types/                  # Global type definitions
```

## 🔒 Security Features

### End-to-End Encryption
- Message encryption using expo-crypto
- Secure key generation and management
- Encrypted message storage
- Secure key exchange protocol

### Authentication Security
- Password strength validation
- Secure session management
- Protected routes and screens
- Rate limiting on auth attempts

### Data Privacy
- User data encryption
- Privacy settings management
- Secure data transmission
- Regular security audits

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Firebase account and project
- iOS Simulator (for Mac users) or Android Studio (for Android development)

### Installation

1. Clone the repository
```bash
git clone https://github.com/Mrdevshakya/afnny-missmatch.git
cd afnny-missmatch
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure Firebase
- Create a Firebase project
- Add your Firebase configuration in `app/config/firebase.ts`
- Enable Authentication and Firestore in Firebase Console

4. Start the development server
```bash
npx expo start
```

## 📱 Available Scripts

```json
{
  "start": "expo start",
  "reset-project": "node ./scripts/reset-project.js",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest --watchAll",
  "lint": "expo lint"
}
```

## 📦 Dependencies

Key dependencies include:
- expo ~52.0.35
- firebase 9.23.0
- @expo/vector-icons ^14.1.0
- expo-router ~4.0.17
- react-native 0.76.7
- And various Expo modules for enhanced functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For support, please open an issue in the repository or contact the development team.

## 🔐 Environment Variables

Required environment variables:
- Firebase configuration (see `app/config/firebase.ts`)
- Other API keys as needed for additional services

## 🌐 Browser Support

The web version supports:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📱 Mobile Support

- iOS 13.0 or newer
- Android 6.0 or newer

## 🔄 State Management

- React Context for global state
- AsyncStorage for persistent storage
- Firebase Realtime Database for real-time features

## 🎨 Styling

- Native styling with StyleSheet
- Linear Gradient for modern UI effects
- Blur effects for enhanced visuals
- Dark theme support

## 🧪 Testing

- Jest for unit testing
- Expo testing utilities
- Firebase emulator support
