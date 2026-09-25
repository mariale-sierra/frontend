import { storage } from './storage';

// Whether this device has ever seen the Home screen's "this is where you log
// progress" coach mark pointing at the tab bar's FAB (Stage 2 of onboarding —
// see app/(tabs)/index.tsx). Device-level — a "seen" flag with nothing
// account-specific about it, so there's no reason to tie it to a signed-in
// user.
//
// `_v2` — bumped 2026-09-25, per explicit "I still can't see the little
// lightbulb messages" report: `CoachMark.tsx`'s own dismiss mechanism was
// reworked earlier this session (tap-anywhere -> a real "Got it" button,
// after "I click it and nothing happens" reports), and separately, this key
// got written on a dev device during an earlier debug preview pass
// (`constants/onboardingDebug.ts`'s `FORCE_SHOW_ONBOARDING_PREVIEWS`,
// briefly `true` then reverted). Either way, any `_v1` dismissal was
// recorded under a UI that no longer ships — bumping the key invalidates
// every stale dismissal (this dev device included) while keeping the real
// "show once, then gone forever" guarantee intact for everyone going
// forward. Bump again, the same way, if this coach mark's UI changes again.
const HAS_SEEN_LOG_COACH_MARK_KEY = 'has_seen_log_coach_mark_v2';

/** Has this device already shown the Home log-FAB coach mark? */
export async function hasSeenLogCoachMark(): Promise<boolean> {
  try {
    return (await storage.getItem(HAS_SEEN_LOG_COACH_MARK_KEY)) === 'true';
  } catch {
    // Can't read storage — treat as "not seen" rather than crash Home's
    // first render; worst case the coach mark shows once more than it should.
    return false;
  }
}

/** Records that this device has now seen (or dismissed) the coach mark. */
export async function markLogCoachMarkSeen(): Promise<void> {
  await storage.setItem(HAS_SEEN_LOG_COACH_MARK_KEY, 'true').catch(() => undefined);
}
