import { storage } from './storage';

// Whether this device has ever seen the challenge-join callout (Stage 4 of
// onboarding — see app/challenge/[id]/index.tsx). Device-level, teaches the
// general CONCEPT of joining (not tied to any one challenge), same shape as
// utils/logCoachMark.ts / utils/exploreTip.ts.
//
// `_v2` — see utils/logCoachMark.ts's own key comment for why all 5 of
// these got bumped together 2026-09-25.
const HAS_SEEN_JOIN_CALLOUT_KEY = 'has_seen_challenge_join_callout_v2';

/** Has this device already shown the challenge-join callout? */
export async function hasSeenChallengeJoinCallout(): Promise<boolean> {
  try {
    return (await storage.getItem(HAS_SEEN_JOIN_CALLOUT_KEY)) === 'true';
  } catch {
    // Can't read storage — treat as "not seen" rather than crash Challenge
    // Info's first render; worst case the callout shows once more than it
    // should.
    return false;
  }
}

/** Records that this device has now seen (or dismissed) the callout. */
export async function markChallengeJoinCalloutSeen(): Promise<void> {
  await storage.setItem(HAS_SEEN_JOIN_CALLOUT_KEY, 'true').catch(() => undefined);
}
