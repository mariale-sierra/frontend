import type { ActivityType } from './activity';
import type { ExerciseMetricType } from './routine';

export type ChallengeVisibility = 'Public' | 'Private';

export type ChallengeExerciseMetricsPayload =
  | {
      kind: 'strength';
      sets: Array<{
        set_number: number;
        reps: number;
        rest_seconds: number;
      }>;
    }
  | {
      kind: 'schema';
      template_id: string;
      values: Record<string, number | { minutes: number; seconds: number }>;
    };

export interface CreateChallengeExercisePayload {
  name: string;
  location: string;
  metric_type: ExerciseMetricType;
  activity_type: ActivityType;
  muscle_groups: string[];
  note?: string;
  metrics: ChallengeExerciseMetricsPayload;
}

export interface CreateChallengePayload {
  name: string;
  description?: string;
  visibility: Lowercase<ChallengeVisibility>;
  duration_days: number;
  cycle_length_days: number;
  categories: string[];
  locations: string[];
  cycle_days: Array<{
    day_number: number;
    is_rest_day: boolean;
    routine_name: string;
    routine_description: string;
    exercises: CreateChallengeExercisePayload[];
  }>;
}

/** Same target shape `TodayRoutineTarget` (services/adapters/metricsAdapter.ts)
 * already reads — `ChallengesService.getCycleDaySummaries()`'s `mapRoutineTargets()`
 * deliberately mirrors `RoutineService.getTodayRoutine()`'s own field names, so
 * the same extraction helpers (`extractTargetValue`/`targetsToFieldMap`) work
 * against either response without a second parallel implementation. */
export interface ChallengeExerciseTargetContract {
  metric_type_id?: number;
  metricType?: { code?: string } | null;
  target_value_int?: number | null;
  target_value_decimal?: number | null;
  target_value_seconds?: number | null;
}

export interface ChallengeExerciseSetContract {
  id?: string;
  set_number?: number;
  rest_seconds_after?: number | null;
  targets?: ChallengeExerciseTargetContract[];
}

export interface ChallengeExerciseContract {
  name?: string;
  location?: string;
  activity_type?: ActivityType;
  /** Real per-set data, added 2026-08-30 once `getCycleDaySummaries()` was
   * extended to join it (was name/activity_type only before — see
   * havit-design-system-SKILL.md's Open Items Tracker). Empty for an
   * exercise whose routine has no `RoutineExerciseSet` rows — falls back to
   * `targets` below, same two-tier shape `getTodayRoutine` already used. */
  sets?: ChallengeExerciseSetContract[];
  /** Exercise-level target fallback for an exercise with no per-set rows. */
  targets?: ChallengeExerciseTargetContract[];
  /** Catalog exercise description (`exercises.description`) — not yet
   * returned by `getCycleDaySummaries()` as of 2026-08-30 (a trivial
   * addition to that endpoint's existing exercise mapping, not shipped
   * yet). Optional/nullable on purpose so Routine-Detail's description
   * toggle degrades gracefully (no chevron shown) until it lands, rather
   * than requiring a frontend change once it does. */
  description?: string | null;
  [key: string]: unknown;
}

export interface ChallengeCycleDayContract {
  day_number?: number;
  is_rest_day?: boolean;
  routine_name?: string;
  routine_description?: string;
  exercises?: ChallengeExerciseContract[];
  [key: string]: unknown;
}

export interface ChallengeActivityContract {
  type?: string;
  label?: string;
  [key: string]: unknown;
}

export interface ChallengeDayContract {
  day?: number;
  title?: string;
  description?: string;
  activities?: string[];
  [key: string]: unknown;
}

export interface ChallengeContract {
  id: number | string;
  name: string;
  description?: string | null;
  visibility?: string;
  duration_days?: number;
  created_by_user_id?: string;
  cycle_length_days?: number;
  categories?: string[];
  locations?: string[];
  activities?: ChallengeActivityContract[];
  days?: ChallengeDayContract[];
  cycle_days?: ChallengeCycleDayContract[];
  /** This challenge's single dominant activity category — computed
   * backend-side, live, from the actual exercise composition of its
   * routines (NOT the `categories` list above, which is just what the
   * creation flow's Add-Exercises picker filtered by). `null` when the
   * challenge has no exercises yet to determine one from. See
   * havit-design-system-SKILL.md → Activity Color System v2. */
  dominant_activity_category?: ActivityType | null;
  /** Has TODAY already got a workout_log for this challenge — rest day or
   * not, photo or not (`UsersService.attachProgress`'s `today_completed`,
   * server-computed from `havit.workout_logs`, not just photo posts).
   * Wasn't typed/read anywhere on the frontend until 2026-08-29, which is
   * why submitting a rest day via the Log-Metrics screen's "Rest day"
   * button never reflected as completed anywhere — every state check only
   * ever looked at whether today had a PHOTO. See `pickTodayCompleted()`
   * (homeAdapter.ts). */
  today_completed?: boolean;
  [key: string]: unknown;
}

export interface JoinChallengeResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

/** Raw backend contract for a challenge member (see GET /challenges/{id}/users). */
export interface ChallengeParticipantContract {
  id: string;
  username: string;
  role: string;
  status: string;
  joined_at: string;
}

export interface ChallengeProgressContract {
  challenge: {
    id: string;
    name: string;
    description?: string;
    duration_days: number;
    visibility: string;
    [key: string]: unknown;
  };
  currentDay?: number;
  totalDays: number;
  completedToday?: boolean;
  hoursLeftToday?: number;
  [key: string]: unknown;
}

export interface ProgressSubmissionRequest {
  challengeId: string;
  routineId?: number;
  imageUrl?: string;
  caption?: string;
  visibility?: 'private' | 'followers';
  isRestDay?: boolean;
}

export interface TodayRoutineExerciseContract {
  id: number;
  name?: string;
  activity_type?: string;
  location?: string;
  sets?: Array<{
    set_number?: number;
    reps?: number;
    rest_seconds?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface TodayRoutineContract {
  routine_id: number;
  exercises?: TodayRoutineExerciseContract[];
  [key: string]: unknown;
}

export interface ChallengePhotoMetric {
  label: string;
  value: string;
}

export interface ChallengePhoto {
  id: string;
  challengeId: string;
  userName: string;
  imageUrl: string | null;
  day: number;
  // The backend collapses a post's real visibility ('private' | 'followers'
  // | 'public') down to this binary field on purpose: 'followers' reads as
  // 'public' here, same as an actual public post — this endpoint only tells
  // you whether the viewer is allowed to see it (already enforced
  // server-side), not the original enum value. Confirmed intentional in
  // WorkoutPostsService.mapRowsToChallengePhotos (backend).
  visibility: 'public' | 'private';
  metrics: ChallengePhotoMetric[];
  description: string;
}
