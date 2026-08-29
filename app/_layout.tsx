import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { AuthProvider } from '../context/authContext';
import { ThemeProvider } from '../context/themeContext';
import { useAuth } from '../hooks/useAuth';
import { UploadSuccessPopup } from '../components/ui/UploadSuccessPopup';
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
      <Stack.Screen name="home/streaks" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      {/* Top-level on purpose, not nested inside "(add)" — that group is
          itself a `fullScreenModal` (opaque), so a transparentModal screen
          nested inside it only reveals that opaque modal's own backdrop, not
          the tabs screen underneath (confirmed on device: solid white).
          Living as a direct sibling of "(tabs)" here makes the tabs
          navigator the actual "previous screen" this reveals. See log.tsx. */}
      <Stack.Screen
        name="log"
        options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="(add)" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="challenge" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/create" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]/progress" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]/invite" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/[id]/routine/[day]" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/routine" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/routine/select" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/routine/create" options={{ headerShown: false }} />
      <Stack.Screen name="challenge/routine/exercises" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Not gating first paint on fontsLoaded/fontError — an earlier version of
  // this file returned null until fonts resolved and was suspected of
  // causing the iOS tab bar to go unresponsive to touch app-wide. That was a
  // red herring: the actual cause (root-caused and fixed in
  // app/(tabs)/_layout.tsx) was React Navigation's `tabBarStyle` option
  // itself, unrelated to font loading. This still not gating first paint on
  // fonts is kept anyway on its own merits — it avoids a blank screen while
  // fonts load, letting the UI render with fallback fonts and pop in Bebas
  // Neue/DM Sans once ready instead.
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
        <UploadSuccessPopup />
      </AuthProvider>
    </ThemeProvider>
  );
}
