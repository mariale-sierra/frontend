import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider } from '../context/authContext';
import { ThemeProvider } from '../context/themeContext';
import { useAuth } from '../hooks/useAuth';
import '../i18n';

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isRestoring } = useAuth();

  useEffect(() => {
    console.log('[router] auth loading:', isRestoring, '| auth user exists:', isAuthenticated);
    if (isRestoring) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated) {
      console.log('[router] redirecting to login from:', segments.join('/') || 'root');
      router.replace('/(auth)/login');
      return;
    }
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isRestoring, segments]);
  if (isRestoring) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(add)" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="challenge" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/create" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]/info" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]/routine/[day]" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/routine" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/routine/select" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/routine/create" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/routine/exercises" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/active-all" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/explore-all" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}