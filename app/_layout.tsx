import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
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
    if (!isAuthenticated && !inAuthGroup) {
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
      <Stack.Screen name="invitations" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="(add)" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="challenge" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/create" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]/progress" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]/info" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]/invite" options={{ headerShown: false }} />
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
  // NOTE: intentionally NOT gating first paint on fontsLoaded/fontError
  // anymore — blocking the root route's initial render (returning null
  // before the Stack ever mounts) is suspected of breaking touch handling
  // on iOS entirely (nav bar became unresponsive app-wide after this gate
  // was added; still investigating, this is the first thing being ruled
  // out). Fonts still load here, they just pop in once ready instead of
  // blocking first paint — same tradeoff Bebas Neue/DM Sans already had
  // before this gate existed.
  useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    BebasNeue_400Regular,
  });

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
