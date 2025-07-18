import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a1a1a' },
        animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="security" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
    </Stack>
  );
} 