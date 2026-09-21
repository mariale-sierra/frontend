import { storage } from './storage';

/**
 * Which non-owned challenges this device has already accounted for, in the
 * Challenges-Mine list — used to detect "I was just approved into a private
 * challenge" (see app/(tabs)/challenges.tsx): a challenge that appears in
 * Mine, that the user didn't create, and that isn't in this set yet, can
 * only have gotten there because its owner approved a pending join request
 * (the direct-join flow already marks a challenge seen the moment it
 * succeeds — see markChallengeMembershipSeen's call site in
 * app/challenge/[id]/index.tsx — so it never double-fires this popup for
 * the same event the "You joined!" toast already covered).
 *
 * Same "keep it in storage, not just memory" reasoning as
 * shownCompletions.ts: an in-memory set resets on every cold start, and
 * every existing membership would look "new" again on the next launch.
 *
 * Separately tracks whether a BASELINE has ever been established
 * (`hasEstablishedBaseline`): the very first time this runs — a fresh
 * install, or the first launch after this feature shipped — every
 * currently-enrolled challenge is a pre-existing membership, not a new
 * approval, and must be recorded as seen WITHOUT popping the popup for each
 * one.
 */
const SEEN_MEMBERSHIPS_KEY = 'seen_challenge_memberships';
const BASELINE_KEY = 'seen_challenge_memberships_baseline_established';

let seen: Promise<Set<string>> | null = null;

function loadSeen(): Promise<Set<string>> {
  if (!seen) {
    seen = storage
      .getItem(SEEN_MEMBERSHIPS_KEY)
      .then((raw) => {
        try {
          const ids = raw ? JSON.parse(raw) : [];
          return new Set<string>(Array.isArray(ids) ? ids : []);
        } catch {
          return new Set<string>();
        }
      })
      .catch(() => new Set<string>());
  }
  return seen;
}

async function persist(ids: Set<string>): Promise<void> {
  await storage.setItem(SEEN_MEMBERSHIPS_KEY, JSON.stringify(Array.from(ids))).catch(() => undefined);
}

/** Has a baseline ever been established on this device (see doc comment above)? */
export async function hasEstablishedMembershipBaseline(): Promise<boolean> {
  return (await storage.getItem(BASELINE_KEY).catch(() => null)) === 'true';
}

/** Marks every one of the given challenges seen, and records that the
 * baseline has been established — call this once, the very first time,
 * instead of markChallengeMembershipSeen per challenge, so none of them
 * individually pop the "you were approved" popup. */
export async function establishMembershipBaseline(challengeIds: string[]): Promise<void> {
  const ids = await loadSeen();
  for (const id of challengeIds) ids.add(id);
  await persist(ids);
  await storage.setItem(BASELINE_KEY, 'true').catch(() => undefined);
}

/** Has this challenge already been accounted for (created, directly joined,
 * or its approval already shown)? */
export async function hasSeenChallengeMembership(challengeId: string): Promise<boolean> {
  return (await loadSeen()).has(challengeId);
}

/** Records that this challenge's membership has been accounted for —
 * whether because the user just created/joined it directly (call this right
 * away, so it's never mistaken for an approval later), or because its
 * "you were approved" popup was just shown. */
export async function markChallengeMembershipSeen(challengeId: string): Promise<void> {
  const ids = await loadSeen();
  ids.add(challengeId);
  await persist(ids);
}

/** Forgets what was loaded, so the next call reads storage again. For tests. */
export function resetSeenChallengeMembershipsCache(): void {
  seen = null;
}
