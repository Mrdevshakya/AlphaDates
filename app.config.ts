import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Amity Missmatch',
  slug: 'amity-missmatch',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/logo.svg',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/logo.svg',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.amity.missmatch'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/logo.svg',
      backgroundColor: '#ffffff'
    },
    package: 'com.amity.missmatch'
  },
  web: {
    favicon: './assets/images/logo.svg'
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
        icon: './assets/images/logo.svg',
        color: '#ffffff'
      }
    ]
  ],
  scheme: 'amity-missmatch',
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: 'your-project-id'
    }
  }
};

export default config; 