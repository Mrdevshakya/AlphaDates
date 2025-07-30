import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'AlphaDate',
  slug: 'alphadate-app',
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
    bundleIdentifier: 'com.alphadate.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/logo.svg',
      backgroundColor: '#ffffff'
    },
    package: 'com.alphadate.app'
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
  scheme: 'alphadate-app',
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