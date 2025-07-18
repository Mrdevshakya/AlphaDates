# AFNNY - Dating App

AFNNY is a modern dating application built with React Native and Expo, designed to help users find meaningful connections through a beautiful and intuitive interface.

## Features

- Modern UI/UX design
- Authentication system
- Profile creation and management
- Match finding algorithm
- Real-time chat
- Location-based matching
- Interest-based matching
- Multi-language support
- Dark mode support

## Tech Stack

- React Native
- Expo
- TypeScript
- Firebase (Authentication & Firestore)
- Expo Router
- React Navigation
- AsyncStorage
- Linear Gradient
- Expo Icons

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac users) or Android Studio (for Android development)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/afnny-missmatch.git
cd afnny-missmatch
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npx expo start
```

## Project Structure

```
afnny-missmatch/
├── app/
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── home/
│   │   ├── matches/
│   │   ├── messages/
│   │   └── profile/
│   ├── context/
│   │   └── AuthContext.tsx
│   └── config/
│       └── firebase.ts
├── assets/
│   ├── images/
│   └── fonts/
├── components/
└── types/
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
