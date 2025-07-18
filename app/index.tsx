import { Redirect } from 'expo-router';
import { useAuth } from './context/AuthContext';

export default function Index() {
  const { user } = useAuth();

  // Redirect based on authentication status
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }
  
  return <Redirect href="/(auth)/sign-in" />;
}
