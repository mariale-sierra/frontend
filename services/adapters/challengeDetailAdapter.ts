import { asString, asNumber, asBoolean } from './adapterUtils';
import { pickCategoriesLabel, pickCycleLengthDays, pickLocationsLabel, pickMembersCount, pickRestDaysCount } from './challengeListAdapter';
import type { ChallengeListLabels } from './challengeListAdapter';
import type { ChallengeContract, ChallengeCycleDayContract, ChallengeDayContract } from '../../types/challenge';

/**
 * One row in "The cycle" list (Challenge-Info wireframe) — one entry per
 * cycle DAY (`day_number`, 1-indexed within the cycle), not per absolute
 * challenge day. A 4-day-cycle 30-day challenge has 4 rows here, always,
 * regardless of `durationDays` — the cycle repeats, it isn't listed 30 times.
 */
export interface ChallengeDaySummary {
  day: number;
  isRestDay: boolean;
  /** Empty for rest days — the UI shows the literal "Rest day" label instead, not this field. */
  routineName: string;
  exerciseCount: number;
  /** Per-exercise location if the backend ever provides one (it doesn't yet — see
   * the skill's Open Items Tracker), else the challenge's own overall `locationsLabel`. */
  location: string;
}

export interface ChallengeDetailViewModel {
  title: string;
  description: string;
  durationDays: number;
  cycleLengthDays: number;
  /** Rest days per SINGLE cycle (e.g. 1 of a 4-day cycle), not per whole challenge. */
  restDaysPerCycleCount: number;
  membersJoined: number;
  locationsLabel: string;
  categoriesLabel: string;
  authorName?: string;
  /** Rest days included — see ChallengeDaySummary's doc comment. */
  days: ChallengeDaySummary[];
}

export type ChallengeDetailAdapterResult =
  | { ok: true; value: ChallengeDetailViewModel }
  | { ok: false };

function getAuthorName(challenge: ChallengeContract): string | undefined {
  const candidates: Array<unknown> = [
    challenge.created_by_username,
    challenge.creator_name,
    challenge.author_name,
    challenge.created_by_user_id,
  ];

  for (const candidate of candidates) {
    const value = asString(candidate);
    if (value) return value;
  }

  return undefined;
}

/**
 * Cycle-day exercises don't carry a `location` field in the current backend
 * response (`ChallengesService.getCycleDaySummaries()` only selects
 * `name`/`activity_type`) — checked defensively anyway in case that ever
 * changes, falling back to the challenge's own overall location list.
 */
function pickDayLocation(cycleDay: ChallengeCycleDayContract, fallback: string): string {
  const exercises = Array.isArray(cycleDay.exercises) ? cycleDay.exercises : [];
  const fromExercise = exercises.length > 0 ? asString(exercises[0]?.location) : '';
  return fromExercise || fallback;
}

function mapCycleDays(
  cycleDays: ChallengeCycleDayContract[] | undefined,
  fallbackLocation: string,
): ChallengeDaySummary[] {
  if (!Array.isArray(cycleDays) || cycleDays.length === 0) return [];

  return cycleDays
    .map((cycleDay): ChallengeDaySummary | null => {
      const day = asNumber(cycleDay.day_number);
      if (!day) return null;

      const isRestDay = asBoolean(cycleDay.is_rest_day) === true;
      const exercises = Array.isArray(cycleDay.exercises) ? cycleDay.exercises : [];

      return {
        day,
        isRestDay,
        routineName: isRestDay ? '' : asString(cycleDay.routine_name),
        exerciseCount: exercises.length,
        location: pickDayLocation(cycleDay, fallbackLocation),
      };
    })
    .filter((item): item is ChallengeDaySummary => item !== null)
    .sort((a, b) => a.day - b.day);
}

/** Legacy flat `days[]` shape (pre-cycle challenges) has no rest-day concept at all — every mapped row is a workout day. */
function mapLegacyDays(
  days: ChallengeDayContract[] | undefined,
  fallbackLocation: string,
): ChallengeDaySummary[] {
  if (!Array.isArray(days) || days.length === 0) return [];

  return days
    .map((day): ChallengeDaySummary | null => {
      const dayNumber = asNumber(day.day);
      const title = asString(day.title);
      if (!dayNumber || !title) return null;

      return {
        day: dayNumber,
        isRestDay: false,
        routineName: title,
        exerciseCount: 0,
        location: fallbackLocation,
      };
    })
    .filter((item): item is ChallengeDaySummary => item !== null)
    .sort((a, b) => a.day - b.day);
}

function mapDays(challenge: ChallengeContract, fallbackLocation: string): ChallengeDaySummary[] {
  const cycleDayMapped = mapCycleDays(challenge.cycle_days, fallbackLocation);
  if (cycleDayMapped.length > 0) return cycleDayMapped;
  return mapLegacyDays(challenge.days, fallbackLocation);
}

export function toChallengeDetailViewModel(
  challenge: ChallengeContract,
  labels: ChallengeListLabels,
): ChallengeDetailAdapterResult {
  const title = asString(challenge.name);
  const durationDays = asNumber(challenge.duration_days);
  if (!title || !durationDays) return { ok: false };

  const locationsLabel = pickLocationsLabel(challenge, labels.locationFallbackLabel);

  return {
    ok: true,
    value: {
      title,
      description: asString(challenge.description) ?? '',
      durationDays,
      cycleLengthDays: pickCycleLengthDays(challenge),
      restDaysPerCycleCount: pickRestDaysCount(challenge),
      membersJoined: pickMembersCount(challenge),
      locationsLabel,
      categoriesLabel: pickCategoriesLabel(challenge, labels.categoryFallbackLabel),
      authorName: getAuthorName(challenge),
      days: mapDays(challenge, locationsLabel),
    },
  };
}
