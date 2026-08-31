import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Genuinely unreachable in normal use — the "+" tab's `tabPress` is always
 * prevented and its `tabBarButton` is swapped for a custom FAB whose
 * `onPress` goes straight to `/log` (see app/(tabs)/_layout.tsx). This file
 * still has to exist for Expo Router to resolve the "add" tab's file-based
 * route, even though nothing should ever actually render it. Kept as a
 * trivial redirect (mirroring the real FAB behavior) rather than the old
 * three-card action menu, which is dead: Metrics and Camera are both reached
 * via the real Log flow now, and Rest Day moved to a button on the Log
 * Metrics screen itself (2026-08-28) — see app/(add)/metrics.tsx.
 */
export default function Add() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/log');
  }, [router]);

  return null;
}
