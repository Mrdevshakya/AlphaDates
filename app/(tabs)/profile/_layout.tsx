import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#1a1a1a' }
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="edit" 
        options={{ 
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
