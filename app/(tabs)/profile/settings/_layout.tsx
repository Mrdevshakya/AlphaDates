import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: '#1a1a1a' },
        animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="account" options={{ headerTitle: 'Account Settings' }} />
      <Stack.Screen name="privacy" options={{ headerTitle: 'Privacy' }} />
      <Stack.Screen name="notifications" options={{ headerTitle: 'Notifications' }} />
      <Stack.Screen name="security" options={{ headerTitle: 'Security' }} />
      <Stack.Screen name="help" options={{ headerTitle: 'Help' }} />
      <Stack.Screen name="about" options={{ headerTitle: 'About' }} />
    </Stack>
  );
} 