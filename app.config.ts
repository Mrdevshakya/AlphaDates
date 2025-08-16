import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'AlphaDate',
  slug: 'alphadate',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/Alphadate.png',
  userInterfaceStyle: 'light',
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.alphadate.app',
    infoPlist: {
      UIKeyboardAppearance: 'light'
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/logo.png',
      backgroundColor: '#1a1a1a'
    },
    package: 'com.alphadate.app',
    softwareKeyboardLayoutMode: 'pan'
  },
  web: {
    favicon: './assets/images/logo.png'
  },
  plugins: [
    'expo-router',
    [
      'expo-image-picker',
      {
        photosPermission: 'The app needs access to your photos to let you share them with your matches.',
        cameraPermission: 'The app needs access to your camera to let you take photos.'
      }
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'The app needs access to your camera to let you take photos.'
      }
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/logo.png',
        color: '#ffffff'
      }
    ]
  ],
  scheme: 'alphadate-app',
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: '8ce98233-409d-48d1-ae2b-06ad35eefb6c'
    }
  }
};

export default config; 