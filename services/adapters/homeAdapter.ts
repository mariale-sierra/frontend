import { asString, asNumber, asBoolean } from './adapterUtils';
import { pickChallengeStatus, deriveChallengeCardState } from './challengeState';
import type { ChallengeCardState } from './challengeState';
import { isRestDay as isRestDayForCycle } from '../../utils/challengeCycle';
import type { ChallengeContract, ChallengePhoto, ChallengeProgressContract } from '../../types/challenge';

/**
 * Home's hero card view model. `state` uses the SAME state machine as
 * Challenges-Mine's status card (challengeState.ts) — `completed` means
 * TODAY has a logged photo, not "the whole challenge is done." Only
 * 'active' | 'rest' | 'completed' are reachable here: getHomeChallengesSorted
 * excludes 'won'/'left' challenges entirely — a challenge that's finished or
 * abandoned isn't something to act on today, so it doesn't belong on Home;
 * it still shows up on the Challenges tab.
 */
export interface HomeActiveChallengeViewModel {
  challengeId: string;
  title: string;
  currentDay: number;
  totalDays: number;
  state: Extract<ChallengeCardState, 'active' | 'rest' | 'completed'>;
  streakCount: number;
}

function pickCurrentDay(challenge: ChallengeContract): number {
  const candidates: Array<unknown> = [
    challenge.current_day,
    challenge.currentDay,
    challenge.active_day,
    challenge.day,
  ];

  for (const candidate of candidates) {
    const value = asNumber(candidate);
    if (value != null && value > 0) return Math.floor(value);
  }

  return 1;
}

function pickIsRestDay(challenge: ChallengeContract): boolean {
  // Direct flag — GET /users/me/challenges (getMyChallenges) now returns a
  // real `is_rest_day` boolean per challenge (backend fix, see the skill's
  // Open Items Tracker), computed server-side in bulk. This is the path that
  // actually resolves in normal operation now.
  const direct = asBoolean(
    challenge.today_is_rest_day ?? challenge.is_rest_day_today ?? challenge.is_rest_day,
  );
  if (direct != null) return direct;

  // Defense-in-depth fallback, not expected to fire in normal operation
  // anymore — same shared cycle-day derivation Challenges-Mine uses
  // (challengeListAdapter.ts). See that file's matching comment.
  if (Array.isArray(challenge.cycle_days) && challenge.cycle_days.length > 0) {
    const currentDay = pickCurrentDay(challenge);
    const cycleLength = asNumber(challenge.cycle_length_days) ?? challenge.cycle_days.length;
    return isRestDayForCycle(currentDay, cycleLength, challenge.cycle_days);
  }

  return false;
}

function pickStreakCount(challenge: ChallengeContract): number {
  const candidates: Array<unknown> = [
    challenge.streak,
    challenge.current_streak,
    challenge.streak_count,
  ];

  for (const candidate of candidates) {
    const value = asNumber(candidate);
    if (value != null && value >= 0) return Math.floor(value);
  }

  return 0;
}

function isEnrolled(challenge: ChallengeContract): boolean {
  const activeCandidates: Array<unknown> = [
    challenge.is_active,
    challenge.joined,
    challenge.is_joined,
    challenge.in_progress,
  ];
  for (const c of activeCandidates) {
    const v = asBoolean(c);
    if (v != null) return v;
  }

  const status = asString(challenge.status || challenge.challenge_status).toLowerCase();
  if (status.includes('active') || status.includes('progress') || status.includes('ongoing')) return true;
  // 'completed'/'left' challenges ARE enrolled (they just get filtered out by
  // state below, not here) — only genuinely unrelated statuses return false.
  if (status.includes('completed') || status.includes('finished') || status.includes('left')
    || status.includes('quit') || status.includes('abandoned') || status.includes('dropped')) return true;
  if (status.includes('archived') || status.includes('closed')) return false;

  const currentDay = pickCurrentDay(challenge);
  const duration = asNumber(challenge.duration_days) ?? 0;
  return duration > 0 && currentDay > 0;
}

function toHomeActiveChallengeViewModel(
  challenge: ChallengeContract,
  state: HomeActiveChallengeViewModel['state'],
): HomeActiveChallengeViewModel {
  return {
    challengeId: String(challenge.id),
    title: asString(challenge.name) || 'Challenge',
    currentDay: pickCurrentDay(challenge),
    totalDays: asNumber(challenge.duration_days) ?? 1,
    state,
    streakCount: pickStreakCount(challenge),
  };
}

/**
 * The user's own latest-per-challenge photos (see challengeState.ts's
 * groupLatestPhotoByChallengeId — from GET /workout-posts/mine, genuinely
 * scoped to this user) are required here, same as Challenges-Mine, to tell
 * "today's photo exists" (→ completed) from "still needs one" (→ active).
 */
export function getHomeChallengesSorted(
  challenges: ChallengeContract[],
  latestPhotoByChallengeId: Map<string, ChallengePhoto>,
): HomeActiveChallengeViewModel[] {
  const withState = challenges
    .filter(isEnrolled)
    .map((challenge) => {
      const currentDay = pickCurrentDay(challenge);
      const state = deriveChallengeCardState({
        status: pickChallengeStatus(challenge),
        isRestDay: pickIsRestDay(challenge),
        currentDay,
        latestPhotoDay: latestPhotoByChallengeId.get(String(challenge.id))?.day ?? null,
      });
      return { challenge, state };
    })
    // 'won'/'left' challenges belong on the Challenges tab, not Home — see
    // the HomeActiveChallengeViewModel doc comment.
    .filter((entry): entry is { challenge: ChallengeContract; state: HomeActiveChallengeViewModel['state'] } =>
      entry.state === 'active' || entry.state === 'rest' || entry.state === 'completed',
    );

  const vms = withState.map(({ challenge, state }) => toHomeActiveChallengeViewModel(challenge, state));

  // Still-actionable challenges (active/rest) first, soonest-to-finish first;
  // already-completed-today ones last (nothing left to do today).
  const actionable = vms
    .filter((vm) => vm.state !== 'completed')
    .sort((a, b) => (a.totalDays - a.currentDay) - (b.totalDays - b.currentDay));
  const completedToday = vms.filter((vm) => vm.state === 'completed');

  return [...actionable, ...completedToday];
}

export function progressToHomeActiveChallengeViewModel(
  progress: ChallengeProgressContract,
): HomeActiveChallengeViewModel {
  const currentDay = progress.currentDay ?? 1;
  const totalDays = progress.totalDays;
  const isRestDay = (progress as Record<string, unknown>).today_is_rest_day === true;

  return {
    challengeId: String(progress.challenge.id),
    title: progress.challenge.name,
    currentDay,
    totalDays,
    // No photo lookup available from this data source (challenge-progress
    // detail screen, not the Home list) — best-effort from the fields this
    // contract already has. Not consumed by any current caller (checked:
    // useChallengeActiveProgress only reads currentDay/totalDays/title), so
    // this is a reasonable placeholder rather than something worth wiring a
    // whole extra fetch for.
    state: progress.completedToday ? 'completed' : isRestDay ? 'rest' : 'active',
    streakCount: pickStreakCount(progress as unknown as ChallengeContract),
  };
}
