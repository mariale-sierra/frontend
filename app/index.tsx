import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}