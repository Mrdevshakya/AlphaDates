import { Stack, useRouter, useSegments } from 'expo-router';
import AuthProvider, { useAuth } from './context/AuthContext';
import { PaymentProvider } from './context/PaymentContext';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';


// Handle authentication routing
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      
      // If user is not logged in and trying to access protected routes, redirect to sign-in
      if (!user && !inAuthGroup && segments[0] !== 'index') {
        router.replace('/(auth)/sign-in');
      }
      // If user is logged in and trying to access auth routes, redirect to home
      else if (user && inAuthGroup) {
        router.replace('/(tabs)/home');
      }
      // If user is logged in and on index page, redirect to home
      else if (user && segments[0] === 'index') {
        router.replace('/(tabs)/home');
      }
      // If user is not logged in and on index page, redirect to sign-in
      else if (!user && segments[0] === 'index') {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="camera" 
        options={{
          presentation: 'modal',
          headerShown: false,
          gestureEnabled: true,
          animation: 'fade',
          animationDuration: 150, // Faster animation
        }}
      />
      <Stack.Screen 
        name="edit-media" 
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'The Bigmaker PersonalUseOnly': require('../assets/fonts/The Bigmaker PersonalUseOnly.ttf'),
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      setAppReady(true);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !appReady) {
    return null;
  }

  return (
    <AuthProvider>
      <PaymentProvider>
        <RootLayoutNav />
      </PaymentProvider>
    </AuthProvider>
  );
}
