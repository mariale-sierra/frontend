import { storage } from './storage';

// Whether this device has ever seen the Explore tab's first-visit tip
// (Stage 3 of onboarding — see app/(tabs)/challenges.tsx). Device-level,
// same reasoning as `utils/logCoachMark.ts`.
//
// `_v2` — see utils/logCoachMark.ts's own key comment for why all 5 of
// these got bumped together 2026-09-25.
const HAS_SEEN_EXPLORE_TIP_KEY = 'has_seen_explore_tip_v2';

/** Has this device already shown the Explore tab's first-visit tip? */
export async function hasSeenExploreTip(): Promise<boolean> {
  try {
    return (await storage.getItem(HAS_SEEN_EXPLORE_TIP_KEY)) === 'true';
  } catch {
    // Can't read storage — treat as "not seen" rather than crash the
    // Explore tab's first render; worst case the tip shows once more than
    // it should.
    return false;
  }
}

/** Records that this device has now seen (or dismissed) the tip. */
export async function markExploreTipSeen(): Promise<void> {
  await storage.setItem(HAS_SEEN_EXPLORE_TIP_KEY, 'true').catch(() => undefined);
}
