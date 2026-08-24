import { asString } from './adapterUtils';
import { colors } from '../../constants/theme';
import type { ChallengeContract, ChallengePhoto } from '../../types/challenge';

export type NormalizedChallengeStatus = 'active' | 'completed' | 'left';
export type ChallengeCardState = 'active' | 'rest' | 'completed' | 'won' | 'left';

/**
 * The single `state` → color mapping, shared by every surface that renders a
 * `ChallengeCardState` (Home hero card, Challenges-Mine status card, the
 * challenge progress ring's eyebrow). Previously duplicated as a local
 * `STATE_BG` in both `ActiveChallengeSection.tsx` and `ChallengeStatusCard.tsx`
 * — consolidated here so a future palette tweak can't drift between screens.
 */
export const STATE_COLOR: Record<ChallengeCardState, string> = {
  active: colors.primary,
  rest: colors.rest,
  completed: colors.success,
  won: colors.neutral,
  left: colors.neutral,
};

/**
 * challenge_user_map.status, normalized. `completed`/`left` are explicit
 * backend state transitions — POST /challenges/:id/complete and
 * /challenges/:id/leave (ChallengesService.completeChallenge/leaveChallenge)
 * — not something derived from progress percentage or calendar time. The
 * real status string is checked first for that reason.
 */
export function pickChallengeStatus(challenge: ChallengeContract): NormalizedChallengeStatus {
  const statusStr = asString(challenge.status ?? challenge.challenge_status).toLowerCase();
  // `left`-family checked FIRST: 'abandoned' contains the substring 'doned',
  // which contains 'done' — with 'completed' checked first, that
  // mis-classified every abandoned challenge as completed (caught by
  // challengeState.test.ts). None of the 'completed'-family words are
  // substrings of any 'left'-family word, so this ordering has no symmetric
  // collision the other way.
  if (statusStr.includes('left') || statusStr.includes('quit') || statusStr.includes('abandoned') || statusStr.includes('dropped')) {
    return 'left';
  }
  if (statusStr.includes('completed') || statusStr.includes('finished') || statusStr.includes('done')) {
    return 'completed';
  }
  return 'active';
}

export interface DeriveChallengeStateInput {
  status: NormalizedChallengeStatus;
  isRestDay: boolean;
  currentDay: number;
  /** The `day` of the user's own latest photo for this challenge, or null if they haven't posted one. */
  latestPhotoDay: number | null;
}

/**
 * The one state machine both Home's hero card and Challenges-Mine's status
 * card use — priority order matters, first match wins:
 * 1. `won` — the whole challenge is finished (see pickChallengeStatus).
 * 2. `left` — the user abandoned it. Same card treatment as `won` (one
 *    "no longer in progress" variant covering both reasons), different
 *    pill icon/copy.
 * 3. `completed` — TODAY specifically has a logged photo. NOT the same as
 *    `won` — this is per-day, not per-challenge.
 * 4. `rest` — today is a rest day with no photo yet.
 * 5. `active` (fallback) — still needs today's photo.
 */
export function deriveChallengeCardState({
  status,
  isRestDay,
  currentDay,
  latestPhotoDay,
}: DeriveChallengeStateInput): ChallengeCardState {
  if (status === 'completed') return 'won';
  if (status === 'left') return 'left';
  if (latestPhotoDay != null && latestPhotoDay === currentDay) return 'completed';
  if (isRestDay) return 'rest';
  return 'active';
}

/**
 * Groups the user's OWN progress photos (GET /workout-posts/mine — genuinely
 * scoped to `p.user_id = $1`, already most-recent-first) by challenge,
 * keeping only the latest one per challenge.
 *
 * Deliberately NOT built from GET /workout-posts/challenge/:id/latest —
 * that endpoint is the challenge-wide gallery's latest photo from ANY
 * participant (`WHERE wl.challenge_id = $1`, no user filter at all), which
 * shipped as a real bug once already: a card never left the "Train day"
 * state after the user uploaded today's photo, because the endpoint wasn't
 * scoped to them specifically. One GET /workout-posts/mine call, grouped
 * client-side, is both correct AND cheaper than the N+1 per-challenge calls
 * the wrong endpoint would need.
 */
export function groupLatestPhotoByChallengeId(photos: ChallengePhoto[]): Map<string, ChallengePhoto> {
  const map = new Map<string, ChallengePhoto>();
  for (const photo of photos) {
    if (!map.has(photo.challengeId)) {
      map.set(photo.challengeId, photo);
    }
  }
  return map;
}
