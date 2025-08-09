import { Redirect } from 'expo-router';

export default function Index() {
  // Let the root layout handle authentication redirects
  return <Redirect href="/(tabs)/home" />;
}
