import { Stack } from 'expo-router';

export default function ChatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="messgae" 
        options={{ 
          title: 'Messages',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="chat" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
