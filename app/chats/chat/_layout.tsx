import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#1a1a1a' }
    }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
} 