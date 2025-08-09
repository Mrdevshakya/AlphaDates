import { Stack, useRouter, useSegments } from 'expo-router';
import AuthProvider, { useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from './components/SplashScreen';

SplashScreen.preventAutoHideAsync();

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
    async function prepareResources() {
      try {
        // Add any additional resource loading here
        // For now, we'll just wait a bit to show the splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    }

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }

    if (!appReady) {
      prepareResources();
    }
  }, [fontsLoaded, appReady]);

  if (!fontsLoaded || !appReady) {
    return <CustomSplashScreen />;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
