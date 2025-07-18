import { Stack, useRouter, useSegments } from 'expo-router';
import AuthProvider, { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

// Handle authentication routing
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === '(auth)';
      
      if (!user && !inAuthGroup) {
        // Redirect to sign in if not authenticated
        router.replace('/(auth)/sign-in');
      } else if (user && inAuthGroup) {
        // Redirect to home if authenticated and in auth group
        router.replace('/(tabs)/home');
      }
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
