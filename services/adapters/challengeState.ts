import { asString } from './adapterUtils';
import { colors, activityColors } from '../../constants/theme';
import type { ActivityType } from '../../types/activity';
import type { MeshRecipeKey } from '../../constants/meshRecipes';
import type { ChallengeContract, ChallengePhoto, ChallengeProgressContract } from '../../types/challenge';

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

const VALID_ACTIVITY_TYPES = new Set<ActivityType>([
  'strength',
  'cardioIntense',
  'cardioLow',
  'flexibility',
  'mindBody',
  'functional',
]);

/** Validates any raw value against the real `ActivityType` enum — shared by
 * `pickDominantActivityCategory` below (reading a `ChallengeContract`, whose
 * `[key: string]: unknown` catch-all means a malformed/missing value can
 * reach it at runtime) and by any screen that receives a dominant category
 * as a plain route param string (e.g. `useLocalSearchParams`), which is
 * just as untrusted. */
export function parseActivityType(value: unknown): ActivityType | null {
  return typeof value === 'string' && VALID_ACTIVITY_TYPES.has(value as ActivityType)
    ? (value as ActivityType)
    : null;
}

/** Validated read of `ChallengeContract.dominant_activity_category`. */
export function pickDominantActivityCategory(challenge: ChallengeContract): ActivityType | null {
  return parseActivityType(challenge.dominant_activity_category);
}

/**
 * Resolves a challenge's own accent color from its dominant activity
 * category (Activity Color System v2, see the design system skill) —
 * falls back to `colors.primary` (white, the neutral chrome accent) when
 * there's no dominant category yet (e.g. zero exercises). This only ever
 * substitutes for the 'active' state's color, never rest/completed/won/left
 * — see `getChallengeCardColor` below.
 */
export function getChallengeAccentColor(dominantActivityCategory: ActivityType | null | undefined): string {
  return dominantActivityCategory ? activityColors[dominantActivityCategory] : colors.primary;
}

/**
 * Card background color for a given `ChallengeCardState`. `rest`/`completed`/
 * `left` keep the fixed `STATE_COLOR` meaning, untouched by the activity color
 * system. `active` resolves to the challenge's own dominant-activity accent
 * instead of the flat primary/white, per the confirmed-in-scope elements in
 * the design system skill's Activity Color System v2 section. `won` does too,
 * per explicit request 2026-09-22 ("the badge should be in the activity color
 * although it says finished") — the label still reads "Finished," only the
 * neutral gray badge fill was wrong; `left` (abandoned, not finished) keeps
 * neutral gray, deliberately not touched by the same request.
 */
export function getChallengeCardColor(
  state: ChallengeCardState,
  dominantActivityCategory: ActivityType | null | undefined,
): string {
  return state === 'active' || state === 'won' ? getChallengeAccentColor(dominantActivityCategory) : STATE_COLOR[state];
}

/**
 * Which glow a glow challenge card has (Challenges-Mine, Explore and Home's hero
 * card): its own on a `rest` day and once today is `completed` — the two states a
 * card is there to tell you about — and otherwise the challenge's own activity
 * (`default` when it has no dominant activity yet), including for a finished or
 * left challenge. The key picks the mesh recipe (`MESH_RECIPES`) and the base
 * color (`getChallengeGlowColor`). (The card's *badge* always takes the state's
 * color; see `getChallengeCardColor`.)
 */
export function getChallengeGlowKey(
  state: ChallengeCardState,
  dominantActivityCategory: ActivityType | null | undefined,
): MeshRecipeKey {
  if (state === 'rest' || state === 'completed') return state;
  return dominantActivityCategory ?? 'default';
}

// The base color behind each glow key.
const GLOW_KEY_COLOR: Record<MeshRecipeKey, string> = {
  ...activityColors,
  rest: colors.rest,
  completed: colors.success,
  default: colors.primary,
};

/**
 * The color a glow challenge card's light and outline take: lavender on a `rest`
 * day, green once today is `completed`, the challenge's own activity color
 * otherwise (the neutral `primary` with no dominant activity yet). See
 * `getChallengeGlowKey`.
 */
export function getChallengeGlowColor(
  state: ChallengeCardState,
  dominantActivityCategory: ActivityType | null | undefined,
): string {
  return GLOW_KEY_COLOR[getChallengeGlowKey(state, dominantActivityCategory)];
}

/**
 * challenge_user_map.status, normalized from a raw (untrusted) value.
 * `completed`/`left` are explicit backend state transitions — POST
 * /challenges/:id/complete and /challenges/:id/leave
 * (ChallengesService.completeChallenge/leaveChallenge) — not something
 * derived from progress percentage or calendar time.
 *
 * Shared by `pickChallengeStatus` below (reading a merged
 * challenge-plus-relation object, e.g. GET /users/me/challenges) and by the
 * Consistency/progress screen (`useChallengeActiveProgress.ts`), which reads
 * the SAME relation status from a differently-named field
 * (`ChallengeProgressContract.relationStatus`, GET /challenges/progress) —
 * that screen's `fullChallenge` (GET /challenges/:id) has no relation status
 * on it at all, only the challenge's own unrelated 'open'/'closed' field, so
 * it must never be passed to `pickChallengeStatus` directly.
 */
export function normalizeChallengeStatus(rawStatus: unknown): NormalizedChallengeStatus {
  const statusStr = asString(rawStatus).toLowerCase();
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

/** `normalizeChallengeStatus`, reading the field off a merged
 * challenge-plus-relation object (GET /users/me/challenges,
 * GET /challenges — NOT the raw GET /challenges/:id shape, see the doc
 * comment on `normalizeChallengeStatus`). */
export function pickChallengeStatus(challenge: ChallengeContract): NormalizedChallengeStatus {
  return normalizeChallengeStatus(challenge.status ?? challenge.challenge_status);
}

export interface DeriveChallengeStateInput {
  status: NormalizedChallengeStatus;
  isRestDay: boolean;
  currentDay: number;
  /** The `day` of the user's own latest photo for this challenge, or null if they haven't posted one. */
  latestPhotoDay: number | null;
  /** Server-computed "today already has a workout_log" (rest day or not,
   * photo or not — see homeAdapter.ts's `pickTodayCompleted`). Added
   * 2026-08-29: `latestPhotoDay` alone can't detect a submitted rest day
   * (no photo, no post at all), which was the real cause of "the Rest day
   * button doesn't actually mark today as done anywhere." Optional so
   * existing callers that haven't been updated yet degrade to the old
   * photo-only behavior instead of breaking. */
  completedToday?: boolean;
}

/**
 * The one state machine both Home's hero card and Challenges-Mine's status
 * card use — priority order matters, first match wins:
 * 1. `won` — the whole challenge is finished (see pickChallengeStatus).
 * 2. `left` — the user abandoned it. Same card treatment as `won` (one
 *    "no longer in progress" variant covering both reasons), different
 *    pill icon/copy.
 * 3. `completed` — TODAY specifically has a logged photo OR a submitted
 *    rest day (`completedToday`). NOT the same as `won` — this is per-day,
 *    not per-challenge.
 * 4. `rest` — today is a cycle-scheduled rest day with nothing logged yet.
 * 5. `active` (fallback) — still needs today's photo.
 */
export function deriveChallengeCardState({
  status,
  isRestDay,
  currentDay,
  latestPhotoDay,
  completedToday,
}: DeriveChallengeStateInput): ChallengeCardState {
  if (status === 'completed') return 'won';
  if (status === 'left') return 'left';
  if (latestPhotoDay != null && latestPhotoDay === currentDay) return 'completed';
  if (completedToday) return 'completed';
  if (isRestDay) return 'rest';
  return 'active';
}

/**
 * Is the whole challenge done? Once its LAST day has been logged — today is the
 * final day (`currentDay` reaches `totalDays`, and the server caps it there) and
 * today has a logged photo or a submitted rest day. That is the moment the app
 * marks the challenge completed (nothing else ever does) and the moment it leaves
 * Challenges-Mine; before it, a challenge is just on its last day.
 */
export function isChallengeFinished(
  progress: Pick<ChallengeProgressContract, 'currentDay' | 'totalDays' | 'completedToday'>,
): boolean {
  return progress.totalDays > 0 && (progress.currentDay ?? 0) >= progress.totalDays && progress.completedToday === true;
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
