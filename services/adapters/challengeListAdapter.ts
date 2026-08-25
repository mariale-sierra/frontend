import { asString, asNumber, asBoolean, normalizeKey } from './adapterUtils';
import { pickChallengeStatus, deriveChallengeCardState } from './challengeState';
import { isRestDay as isRestDayForCycle } from '../../utils/challengeCycle';
import type { ActiveChallengeViewModel, ChallengesScreenViewModel, ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import type { ActivityType } from '../../types/activity';
import type { ChallengeContract, ChallengePhoto } from '../../types/challenge';

export interface ChallengeListLabels {
  locationFallbackLabel: string;
  categoryFallbackLabel: string;
}

/**
 * Mine-tab status card view model (Challenges-Mine wireframe) — a separate
 * shape from ActiveChallengeViewModel below (the old card's model, still
 * used by app/challenge/active-all.tsx). Card background/pill/photo-panel
 * are entirely driven by `state`:
 * - `won` / `left`: the challenge itself is over — challenge_user_map.status
 *   is 'completed' (finished the whole thing) or 'left' (abandoned it).
 *   Same neutral-toned card treatment for both (per design decision — one
 *   card variant covering multiple "this challenge is inactive" states),
 *   different pill icon/copy.
 * - `completed`: TODAY specifically has a logged photo (NOT the same as
 *   `won` — this is per-day, checked via GET /workout-posts/challenge/:id/latest
 *   and comparing its `day` to `currentDay`).
 * - `rest`: today is a rest day and has no photo.
 * - `active`: none of the above — still needs today's photo (shows the
 *   "Add photo" CTA).
 */
export interface ChallengeMineCardViewModel {
  challengeId: string;
  title: string;
  currentDay: number;
  totalDays: number;
  state: 'active' | 'rest' | 'completed' | 'won' | 'left';
  /** Most recent visible photo for this challenge, if any — real image shown in the card's side panel instead of a placeholder. For `state === 'completed'` this IS today's photo; for `won`/`left` it's whatever the last one was. */
  latestPhotoUrl: string | null;
}


function asActivityType(value: string): ActivityType | null {
  const normalized = normalizeKey(value);

  const map: Record<string, ActivityType> = {
    strength: 'strength',
    cardiointense: 'cardioIntense',
    cardiolow: 'cardioLow',
    flexibility: 'flexibility',
    mindbody: 'mindBody',
    functional: 'functional',
  };

  return map[normalized] ?? null;
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
  // anymore: derive from `cycle_days` (same shared formula as the
  // Consistency screen's utils/challengeCycle.ts) if a caller ever passes a
  // challenge object that has `cycle_days` but not the direct flag — e.g.
  // GET /challenges/:id's full detail shape, which has always included
  // `cycle_days` and never `is_rest_day` at the top level.
  if (Array.isArray(challenge.cycle_days) && challenge.cycle_days.length > 0) {
    const currentDay = pickCurrentDay(challenge);
    const cycleLength = asNumber(challenge.cycle_length_days) ?? challenge.cycle_days.length;
    return isRestDayForCycle(currentDay, cycleLength, challenge.cycle_days);
  }

  return false;
}

function pickActivityTypes(challenge: ChallengeContract): [ActivityType, ActivityType?, ActivityType?] {
  const seen = new Set<ActivityType>();
  const types: ActivityType[] = [];

  const addType = (value: string | null | undefined) => {
    const t = asActivityType(asString(value ?? ''));
    if (t && !seen.has(t)) { seen.add(t); types.push(t); }
  };

  if (Array.isArray(challenge.activities)) {
    challenge.activities.forEach((item) => addType(item?.type));
  }
  if (Array.isArray(challenge.categories)) {
    challenge.categories.forEach((cat) => addType(asString(cat)));
  }

  if (types.length === 0) types.push('strength');
  return [types[0], types[1], types[2]];
}

function pickActivityType(challenge: ChallengeContract): ActivityType {
  return pickActivityTypes(challenge)[0];
}

function pickProgressPercent(challenge: ChallengeContract): number {
  const candidates: Array<unknown> = [
    challenge.progress_percent,
    challenge.progress,
    challenge.progressPercentage,
    challenge.completion_percentage,
  ];

  for (const candidate of candidates) {
    const value = asNumber(candidate);
    if (value != null) {
      return Math.max(0, Math.min(100, Math.round(value)));
    }
  }

  const currentDay = pickCurrentDay(challenge);
  const duration = asNumber(challenge.duration_days) ?? 0;
  if (duration > 0 && currentDay > 0) {
    const computed = Math.round((currentDay / duration) * 100);
    return Math.max(0, Math.min(100, computed));
  }

  return 0;
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
    if (value != null && value > 0) {
      return Math.floor(value);
    }
  }

  return 1;
}

function pickStreakCount(challenge: ChallengeContract): number {
  const candidates: Array<unknown> = [
    challenge.streak,
    challenge.current_streak,
    challenge.streak_count,
  ];

  for (const candidate of candidates) {
    const value = asNumber(candidate);
    if (value != null && value >= 0) {
      return Math.floor(value);
    }
  }

  return 0;
}

export function pickMembersCount(challenge: ChallengeContract): number {
  const candidates: Array<unknown> = [
    challenge.members_count,
    challenge.member_count,
    challenge.members_joined,
    challenge.membersJoined,
  ];

  for (const candidate of candidates) {
    const value = asNumber(candidate);
    if (value != null && value >= 0) {
      return Math.floor(value);
    }
  }

  return 0;
}

/** All locations joined ("Gym, Home, or Studio") — Explore card's location row. */
export function pickLocationsLabel(challenge: ChallengeContract, fallback: string): string {
  const items = (challenge.locations ?? []).map((l) => asString(l)).filter(Boolean);
  if (items.length === 0) return fallback;
  try {
    return new Intl.ListFormat(undefined, { style: 'long', type: 'disjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}

/** Raw category strings joined ("Strength, Cardio, Mobility") — Explore card's category row. Deliberately NOT normalized through the strict ActivityType enum: this is a whole-challenge tag summary, not per-exercise icon data. */
export function pickCategoriesLabel(challenge: ChallengeContract, fallback: string): string {
  const items = (challenge.categories ?? []).map((c) => asString(c)).filter(Boolean);
  return items.length > 0 ? items.join(', ') : fallback;
}

export function pickCycleLengthDays(challenge: ChallengeContract): number {
  const direct = asNumber(challenge.cycle_length_days);
  if (direct != null) return direct;
  return Array.isArray(challenge.cycle_days) ? challenge.cycle_days.length : 0;
}

export function pickRestDaysCount(challenge: ChallengeContract): number {
  if (!Array.isArray(challenge.cycle_days)) return 0;
  return challenge.cycle_days.filter((d) => asBoolean(d.is_rest_day) === true).length;
}

// pickChallengeStatus now lives in ./challengeState (shared with
// homeAdapter.ts — both Home's hero card and this Mine tab need the exact
// same status detection).

function isChallengeActive(challenge: ChallengeContract): boolean {
  const explicitCandidates: Array<unknown> = [
    challenge.is_active,
    challenge.joined,
    challenge.is_joined,
    challenge.in_progress,
  ];

  for (const candidate of explicitCandidates) {
    const value = asBoolean(candidate);
    if (value != null) {
      return value;
    }
  }

  const status = asString(challenge.status || challenge.challenge_status).toLowerCase();
  if (status.includes('active') || status.includes('progress') || status.includes('ongoing')) {
    return true;
  }

  if (status.includes('completed') || status.includes('archived') || status.includes('closed')) {
    return false;
  }

  const progressPercent = pickProgressPercent(challenge);
  if (progressPercent > 0 && progressPercent < 100) {
    return true;
  }

  return false;
}

function toActiveCard(challenge: ChallengeContract): ActiveChallengeViewModel {
  const [activityType, secondaryActivityType, tertiaryActivityType] = pickActivityTypes(challenge);
  return {
    challengeId: String(challenge.id),
    title: asString(challenge.name) || 'Untitled challenge',
    day: pickCurrentDay(challenge),
    progressPercent: pickProgressPercent(challenge),
    streakCount: pickStreakCount(challenge),
    activityType,
    secondaryActivityType,
    tertiaryActivityType,
    status: pickChallengeStatus(challenge),
    isRestDay: pickIsRestDay(challenge),
  };
}

function toExploreCard(challenge: ChallengeContract, labels: ChallengeListLabels): ExploreChallengeViewModel {
  return {
    challengeId: String(challenge.id),
    title: asString(challenge.name) || 'Untitled challenge',
    durationDays: asNumber(challenge.duration_days) ?? 0,
    cycleLengthDays: pickCycleLengthDays(challenge),
    restDaysCount: pickRestDaysCount(challenge),
    locationsLabel: pickLocationsLabel(challenge, labels.locationFallbackLabel),
    categoriesLabel: pickCategoriesLabel(challenge, labels.categoryFallbackLabel),
    membersCount: pickMembersCount(challenge),
  };
}

function toMineCard(challenge: ChallengeContract, latestPhoto: ChallengePhoto | undefined): ChallengeMineCardViewModel {
  const currentDay = pickCurrentDay(challenge);

  const state = deriveChallengeCardState({
    status: pickChallengeStatus(challenge),
    isRestDay: pickIsRestDay(challenge),
    currentDay,
    latestPhotoDay: latestPhoto?.day ?? null,
  });

  return {
    challengeId: String(challenge.id),
    title: asString(challenge.name) || 'Untitled challenge',
    currentDay,
    totalDays: asNumber(challenge.duration_days) ?? 1,
    state,
    latestPhotoUrl: latestPhoto?.imageUrl ?? null,
  };
}

const MINE_STATE_PRIORITY: Record<ChallengeMineCardViewModel['state'], number> = {
  active: 0,
  rest: 1,
  completed: 2,
  won: 3,
  left: 4,
};

/**
 * Challenges-Mine tab — every challenge the user is enrolled in, in whatever
 * state (unlike toEnrolledChallengesViewModel's callers, which historically
 * filter separately). Sorted active → rest → completed → won → left,
 * matching the wireframe's example order.
 *
 * Deliberately kept pure (no fetching here) — `latestPhotoByChallengeId` is
 * pre-fetched by the caller via a SINGLE GET /workout-posts/mine call,
 * grouped with challengeState.ts's groupLatestPhotoByChallengeId. NOT one
 * GET /workout-posts/challenge/:id/latest per challenge — that endpoint is
 * the challenge-wide gallery's latest photo from any participant, not this
 * user's, and using it here was a real shipped bug (see challengeState.ts).
 */
export function toChallengeMineViewModels(
  challenges: ChallengeContract[],
  latestPhotoByChallengeId: Map<string, ChallengePhoto>,
): ChallengeMineCardViewModel[] {
  return challenges
    .map((challenge) => toMineCard(challenge, latestPhotoByChallengeId.get(String(challenge.id))))
    .sort((a, b) => MINE_STATE_PRIORITY[a.state] - MINE_STATE_PRIORITY[b.state]);
}

export function toChallengeListViewModel(
  challenges: ChallengeContract[],
  labels: ChallengeListLabels,
): ChallengesScreenViewModel {
  const activeChallenges = challenges.filter(isChallengeActive).map(toActiveCard);
  const exploreChallenges = challenges.map((challenge) => toExploreCard(challenge, labels));

  return {
    activeChallenges,
    exploreChallenges,
  };
}

export function toEnrolledChallengesViewModel(
  challenges: ChallengeContract[],
): ActiveChallengeViewModel[] {
  return challenges.map(toActiveCard);
}

export function toExploreChallengeViewModels(
  challenges: ChallengeContract[],
): ExploreChallengeViewModel[] {
  const labels: ChallengeListLabels = {
    locationFallbackLabel: 'Any location',
    categoryFallbackLabel: 'General',
  };
  return challenges.map((c) => toExploreCard(c, labels));
}
