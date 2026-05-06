import type { ActivityType } from '../constants/theme';
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

export interface ChallengeExerciseContract {
  name?: string;
  location?: string;
  activity_type?: ActivityType;
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
  [key: string]: unknown;
}

export interface JoinChallengeResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}
