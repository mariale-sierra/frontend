import { storage } from './storage';

// Whether this device has ever seen the Messages screen's "tap the airplane
// button to compose" coach mark. Device-level, same shape as the other
// onboarding coach marks (utils/logCoachMark.ts, etc.).
//
// `_v2` — see utils/logCoachMark.ts's own key comment for why all 5 of
// these got bumped together 2026-09-25.
const HAS_SEEN_COMPOSE_COACH_MARK_KEY = 'has_seen_compose_coach_mark_v2';

/** Has this device already shown the Messages screen's compose coach mark? */
export async function hasSeenComposeCoachMark(): Promise<boolean> {
  try {
    return (await storage.getItem(HAS_SEEN_COMPOSE_COACH_MARK_KEY)) === 'true';
  } catch {
    // Can't read storage — treat as "not seen" rather than crash the
    // Messages screen's first render; worst case the coach mark shows once
    // more than it should.
    return false;
  }
}

/** Records that this device has now seen (or dismissed) the coach mark. */
export async function markComposeCoachMarkSeen(): Promise<void> {
  await storage.setItem(HAS_SEEN_COMPOSE_COACH_MARK_KEY, 'true').catch(() => undefined);
}
