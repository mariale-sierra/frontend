import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, ThemeProvider as NavigationThemeProvider, useRouter, useSegments } from 'expo-router';
import type { Theme as NavigationTheme } from 'expo-router';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { InterTight_700Bold } from '@expo-google-fonts/inter-tight';
import { AuthProvider } from '../context/authContext';
import { ThemeProvider } from '../context/themeContext';
import { useAuth } from '../hooks/useAuth';
import { ChallengeFinishedPopup } from '../components/ui/ChallengeFinishedPopup';
import { ChallengeJoinApprovedPopup } from '../components/ui/ChallengeJoinApprovedPopup';
import { UploadSuccessPopup } from '../components/ui/UploadSuccessPopup';
import { ErrorNotificationProvider } from '../components/ui/ErrorNotificationProvider';
import i18n, { PREFERRED_LANGUAGE_KEY } from '../i18n';
import type { SupportedLanguage } from '../i18n';
import { storage } from '../utils/storage';
import { colors, fontFamily } from '../constants/theme';

const navigationTheme: NavigationTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.ink,
    card: colors.ink,
    text: colors.paper,
    border: 'transparent',
    notification: colors.accent,
  },
  fonts: {
    regular: { fontFamily: fontFamily.regular, fontWeight: '400' },
    medium: { fontFamily: fontFamily.medium, fontWeight: '500' },
    bold: { fontFamily: fontFamily.bold, fontWeight: '700' },
    heavy: { fontFamily: fontFamily.bold, fontWeight: '700' },
  },
};

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isRestoring } = useAuth();

  // Simplified 2026-09-24, per explicit "the first thing the user will see
  // is the login screen" request: the standalone pre-login welcome carousel
  // is gone — its 3 pages are now the first steps of the register wizard
  // itself (app/(auth)/register.tsx), reached only by tapping "Register" on
  // this same login screen, not shown to everyone up front. Back to the
  // simple pre-onboarding rule: unauthenticated and outside `(auth)` → login;
  // authenticated and still inside `(auth)` → tabs.
  //
  // Real bug, fixed 2026-09-24, per explicit "you didn't add the profile
  // badges screen! WHY?" report: register.tsx creates the account, then
  // calls `router.replace('/onboarding/practices')` itself, directly,
  // right after — the assumption was that this always lands in the SAME
  // render batch as the isAuthenticated flip it just caused, so this
  // effect would only ever see the post-navigation state. That held in
  // testing before, but evidently isn't guaranteed — if this effect's
  // `isAuthenticated && inAuthGroup` check ever fires while `segments`
  // still says `register` (the flip landing one render ahead of the
  // navigation, however that happens), it would redirect straight to
  // `/(tabs)` and the badges screen would never be reached at all: from the
  // outside, indistinguishable from it never having been built. Fixed by
  // making this effect refuse to act on `register` specifically — it's the
  // one `(auth)` screen that always manages its OWN post-authentication
  // navigation, so this waits for register.tsx's own call to actually move
  // `segments` off of it, instead of racing to get there first.
  useEffect(() => {
    if (isRestoring) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }
    if (isAuthenticated && inAuthGroup) {
      const onRegisterScreen = (segments as string[])[1] === 'register';
      if (!onRegisterScreen) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isRestoring, segments]);
  if (isRestoring) {
    return null;
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
        <Stack.Screen name="invitations" options={{ headerShown: false }} />
        <Stack.Screen name="home/streaks" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/index" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/[conversationId]" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/new" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/chat-details" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/spaces/index" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/spaces/create" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/spaces/[id]/index" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/spaces/[id]/members" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/spaces/[id]/manage" options={{ headerShown: false }} />
        <Stack.Screen name="messaging/spaces/[id]/join-requests" options={{ headerShown: false }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
        {/* Post-registration practice picker — lives outside both "(auth)"
            and "(tabs)", same top-level-registration precedent as
            "home/streaks" below. `gestureEnabled: false` so it can't be
            swiped away back to the register screen. */}
        <Stack.Screen name="onboarding/practices" options={{ headerShown: false, gestureEnabled: false }} />
        {/* Real bug, fixed 2026-08-29, per explicit report: this route had no
            entry here at all, so it fell back to Expo Router's default native
            header — the "expo top white bar" the user saw sitting on top of
            this screen's own BackButton/header. Every other custom-header
            screen in this app is registered the same way. */}
        <Stack.Screen name="profile/[userId]" options={{ headerShown: false }} />
        <Stack.Screen name="profile/about" options={{ headerShown: false }} />
        <Stack.Screen name="exercises/index" options={{ headerShown: false }} />
        <Stack.Screen name="exercises/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="exercises/muscles/index" options={{ headerShown: false }} />
        <Stack.Screen name="exercises/muscles/[code]" options={{ headerShown: false }} />
        <Stack.Screen name="exercises/muscles/region/[code]" options={{ headerShown: false }} />
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
      </Stack>
    </NavigationThemeProvider>
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
  // fonts load, letting the UI render with fallback fonts and pop in Inter
  // Tight/DM Sans once ready instead.
  useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    InterTight_700Bold,
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
    // Required by react-native-gesture-handler (added for the bottom nav's
    // drag-to-switch-tabs gesture, see components/navigation/
    // bottomNavTabButton.tsx) — gestures silently fail to register touches
    // correctly without this wrapping the app root. Zero effect on anything
    // else; a plain flex:1 passthrough view.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorNotificationProvider>
            <RootNavigator />
            <UploadSuccessPopup />
            <ChallengeFinishedPopup />
            <ChallengeJoinApprovedPopup />
          </ErrorNotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
