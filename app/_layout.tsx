import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { AuthProvider } from '../context/authContext';
import { ThemeProvider } from '../context/themeContext';
import { useAuth } from '../hooks/useAuth';
import { UploadSuccessPopup } from '../components/ui/UploadSuccessPopup';
import { ErrorNotificationProvider } from '../components/ui/ErrorNotificationProvider';
import i18n, { PREFERRED_LANGUAGE_KEY } from '../i18n';
import type { SupportedLanguage } from '../i18n';
import { storage } from '../utils/storage';

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
      {/* Real bug, fixed 2026-08-29, per explicit report: this route had no
          entry here at all, so it fell back to Expo Router's default native
          header — the "expo top white bar" the user saw sitting on top of
          this screen's own BackButton/header. Every other custom-header
          screen in this app is registered the same way. */}
      <Stack.Screen name="profile/[userId]" options={{ headerShown: false }} />
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

  // i18n itself initializes synchronously at import time using only the
  // device locale (see i18n/index.ts) — a real user-persisted language
  // choice lives in AsyncStorage and can only be applied once, here, after
  // the app has actually mounted. A plain top-level `storage` import (not a
  // lazy one) — a first attempt used `await import()` inside a helper in
  // i18n/index.ts itself and the toggle stayed completely non-functional at
  // runtime even after that "fix" (still fixed 2026-08-29, see that file's
  // own doc comment for the full history).
  useEffect(() => {
    storage
      .getItem(PREFERRED_LANGUAGE_KEY)
      .then((saved) => {
        if ((saved === 'en' || saved === 'es') && saved !== i18n.language) {
          return i18n.changeLanguage(saved as SupportedLanguage);
        }
      })
      .catch((error) => {
        console.error('[i18n] failed to apply persisted language', error);
      });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorNotificationProvider>
          <RootNavigator />
          <UploadSuccessPopup />
        </ErrorNotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
