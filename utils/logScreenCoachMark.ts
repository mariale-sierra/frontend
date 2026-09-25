import { storage } from './storage';

// Whether this device has ever seen the metrics-entry ("log day") screen's
// coach mark (Stage 5 of onboarding — see app/(add)/metrics.tsx). Device
// -level, same shape as utils/logCoachMark.ts / utils/challengeJoinCallout.ts.
//
// `_v2` — see utils/logCoachMark.ts's own key comment for why all 5 of
// these got bumped together 2026-09-25.
const HAS_SEEN_LOG_SCREEN_COACH_MARK_KEY = 'has_seen_log_screen_coach_mark_v2';

/** Has this device already shown the metrics-entry screen's coach mark? */
export async function hasSeenLogScreenCoachMark(): Promise<boolean> {
  try {
    return (await storage.getItem(HAS_SEEN_LOG_SCREEN_COACH_MARK_KEY)) === 'true';
  } catch {
    // Can't read storage — treat as "not seen" rather than crash the
    // metrics screen's first render; worst case the coach mark shows once
    // more than it should.
    return false;
  }
}

/** Records that this device has now seen (or dismissed) the coach mark. */
export async function markLogScreenCoachMarkSeen(): Promise<void> {
  await storage.setItem(HAS_SEEN_LOG_SCREEN_COACH_MARK_KEY, 'true').catch(() => undefined);
}
