import { asString, asNumber, normalizeKey } from './adapterUtils';
import type { ActivityType } from '../../constants/theme';
import type {
  ChallengeActivityContract,
  ChallengeContract,
  ChallengeCycleDayContract,
  ChallengeDayContract,
  ChallengeExerciseContract,
} from '../../types/challenge';

export type ChallengeLocation = 'home' | 'outdoor' | 'gym' | 'studio' | 'anywhere';

export interface ChallengeActivityBadge {
  activityType: ActivityType;
  label: string;
}

export interface ChallengeDaySummary {
  day: number;
  title: string;
  description: string;
  activities: ActivityType[];
}

export interface ChallengeDetailViewModel {
  title: string;
  description: string;
  durationDays: number;
  membersJoined: number;
  locations: ChallengeLocation[];
  activities: ChallengeActivityBadge[];
  dominantActivity: ActivityType;
  authorName?: string;
  days: ChallengeDaySummary[];
}

function getMembersJoined(challenge: ChallengeContract) {
  const candidateKeys = [
    'members_joined',
    'membersJoined',
    'joined_members_count',
    'member_count',
  ] as const;

  for (const key of candidateKeys) {
    const value = challenge[key];
    const numeric = asNumber(value);
    if (numeric != null && numeric >= 0) {
      return numeric;
    }
  }

  return 0;
}

export interface ChallengeDetailMissingData {
  field: string;
  requirement: string;
}

export type ChallengeDetailAdapterResult =
  | {
      ok: true;
      value: ChallengeDetailViewModel;
      missingData: ChallengeDetailMissingData[];
    }
  | {
      ok: false;
      missingData: ChallengeDetailMissingData[];
    };


function parseActivityType(value: string): ActivityType | null {
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

function parseLocation(value: string): ChallengeLocation | null {
  const normalized = normalizeKey(value);

  if (normalized === 'home') return 'home';
  if (normalized === 'outdoor' || normalized === 'outside') return 'outdoor';
  if (normalized === 'gym') return 'gym';
  if (normalized === 'studio') return 'studio';
  if (normalized === 'anywhere' || normalized === 'any') return 'anywhere';

  return null;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function formatActivityLabel(activityType: ActivityType) {
  const labels: Record<ActivityType, string> = {
    strength: 'Strength',
    cardioIntense: 'Cardio Intense',
    cardioLow: 'Cardio Low',
    flexibility: 'Flexibility',
    mindBody: 'Mind Body',
    functional: 'Functional',
  };

  return labels[activityType];
}

function deriveActivityTypesFromCycleDays(cycleDays: ChallengeCycleDayContract[] | undefined) {
  if (!Array.isArray(cycleDays)) {
    return [];
  }

  return unique(
    cycleDays.flatMap((cycleDay) => {
      if (!Array.isArray(cycleDay.exercises)) {
        return [];
      }

      return cycleDay.exercises
        .map((exercise) => parseActivityType(asString(exercise.activity_type)))
        .filter((item): item is ActivityType => Boolean(item));
    }),
  );
}

function countActivityOccurrences(
  challenge: ChallengeContract,
  allowedActivities: Set<ActivityType>,
) {
  const counts: Record<ActivityType, number> = {
    strength: 0,
    cardioIntense: 0,
    cardioLow: 0,
    flexibility: 0,
    mindBody: 0,
    functional: 0,
  };

  if (Array.isArray(challenge.cycle_days)) {
    for (const cycleDay of challenge.cycle_days) {
      if (!Array.isArray(cycleDay.exercises)) {
        continue;
      }

      for (const exercise of cycleDay.exercises) {
        const activityType = parseActivityType(asString(exercise.activity_type));
        if (activityType && allowedActivities.has(activityType)) {
          counts[activityType] += 1;
        }
      }
    }
  }

  if (Array.isArray(challenge.days)) {
    for (const day of challenge.days) {
      if (!Array.isArray(day.activities)) {
        continue;
      }

      for (const activity of day.activities) {
        const activityType = parseActivityType(asString(activity));
        if (activityType && allowedActivities.has(activityType)) {
          counts[activityType] += 1;
        }
      }
    }
  }

  return counts;
}

function determineDominantActivity(
  challenge: ChallengeContract,
  activities: ChallengeActivityBadge[],
) {
  const allowedActivities = new Set(activities.map((item) => item.activityType));
  const counts = countActivityOccurrences(challenge, allowedActivities);

  const sorted = (Object.entries(counts) as [ActivityType, number][]) 
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length > 0) {
    return sorted[0][0];
  }

  return activities[0]?.activityType ?? null;
}

function mapActivities(
  challenge: ChallengeContract,
  missingData: ChallengeDetailMissingData[],
) {
  const directActivities = Array.isArray(challenge.activities)
    ? challenge.activities
        .map((item: ChallengeActivityContract) => {
          const typeValue = parseActivityType(asString(item.type));
          const labelValue = asString(item.label);

          if (!typeValue) {
            return null;
          }

          return {
            activityType: typeValue,
            label: labelValue || formatActivityLabel(typeValue),
          };
        })
        .filter((item): item is ChallengeActivityBadge => Boolean(item))
    : [];

  if (directActivities.length > 0) {
    return directActivities;
  }

  const categoryActivities = Array.isArray(challenge.categories)
    ? challenge.categories
        .map((category) => parseActivityType(asString(category)))
        .filter((item): item is ActivityType => Boolean(item))
    : [];

  const cycleActivities = deriveActivityTypesFromCycleDays(challenge.cycle_days);
  const derivedTypes = unique([...categoryActivities, ...cycleActivities]);

  if (derivedTypes.length === 0) {
    missingData.push({
      field: 'activities',
      requirement: 'Provide activities or category/cycle-day activity types to build challenge badges.',
    });
    return [];
  }

  return derivedTypes.map((activityType) => ({
    activityType,
    label: formatActivityLabel(activityType),
  }));
}

function getAuthorName(challenge: ChallengeContract) {
  const candidates: Array<unknown> = [
    challenge.created_by_username,
    challenge.creator_name,
    challenge.author_name,
    challenge.created_by_user_id,
  ];

  for (const candidate of candidates) {
    const value = asString(candidate);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function mapLocations(
  locations: string[] | undefined,
  missingData: ChallengeDetailMissingData[],
) {
  if (!Array.isArray(locations) || locations.length === 0) {
    missingData.push({
      field: 'locations',
      requirement: 'Provide locations: string[] such as ["home", "gym"].',
    });
    return [];
  }

  const mapped = unique(
    locations
      .map((location) => parseLocation(asString(location)))
      .filter((item): item is ChallengeLocation => Boolean(item)),
  );

  if (mapped.length === 0) {
    missingData.push({
      field: 'locations',
      requirement: 'Provide at least one valid location value: home, gym, outdoor, studio, anywhere.',
    });
  }

  return mapped;
}

function mapLegacyDays(
  days: ChallengeDayContract[] | undefined,
  allowedActivities: Set<ActivityType>,
) {
  if (!Array.isArray(days) || days.length === 0) {
    return [];
  }

  return days
    .map((day) => {
      const dayNumber = asNumber(day.day);
      const title = asString(day.title);
      const description = asString(day.description);
      const dayActivities = Array.isArray(day.activities)
        ? unique(
            day.activities
              .map((activity) => parseActivityType(asString(activity)))
              .filter((item): item is ActivityType => {
                if (!item) {
                  return false;
                }

                return allowedActivities.has(item);
              }),
          )
        : [];

      if (!dayNumber || !title || !description || dayActivities.length === 0) {
        return null;
      }

      return {
        day: dayNumber,
        title,
        description,
        activities: dayActivities,
      };
    })
    .filter((item): item is ChallengeDaySummary => Boolean(item))
    .sort((a, b) => a.day - b.day);
}

function mapCycleDays(
  cycleDays: ChallengeCycleDayContract[] | undefined,
  allowedActivities: Set<ActivityType>,
) {
  if (!Array.isArray(cycleDays) || cycleDays.length === 0) {
    return [];
  }

  return cycleDays
    .map((day) => {
      const dayNumber = asNumber(day.day_number);
      const title = asString(day.routine_name);
      const description = asString(day.routine_description);
      const dayActivities = Array.isArray(day.exercises)
        ? unique(
            day.exercises
              .map((exercise: ChallengeExerciseContract) =>
                parseActivityType(asString(exercise.activity_type)),
              )
              .filter((item): item is ActivityType => {
                if (!item) {
                  return false;
                }

                return allowedActivities.has(item);
              }),
          )
        : [];

      if (!dayNumber || !title || !description || dayActivities.length === 0) {
        return null;
      }

      return {
        day: dayNumber,
        title,
        description,
        activities: dayActivities,
      };
    })
    .filter((item): item is ChallengeDaySummary => Boolean(item))
    .sort((a, b) => a.day - b.day);
}

function mapDays(
  days: ChallengeDayContract[] | undefined,
  cycleDays: ChallengeCycleDayContract[] | undefined,
  activities: ChallengeActivityBadge[],
  missingData: ChallengeDetailMissingData[],
) {
  const allowedActivities = new Set(activities.map((item) => item.activityType));

  const cycleDayMapped = mapCycleDays(cycleDays, allowedActivities);
  if (cycleDayMapped.length > 0) {
    return cycleDayMapped;
  }

  const legacyMapped = mapLegacyDays(days, allowedActivities);
  if (legacyMapped.length > 0) {
    return legacyMapped;
  }

  missingData.push({
    field: 'days',
    requirement: 'Provide cycle_days or days with routine/day metadata and valid activities.',
  });

  return [];
}

export function toChallengeDetailViewModel(challenge: ChallengeContract): ChallengeDetailAdapterResult {
  const missingData: ChallengeDetailMissingData[] = [];

  const title = asString(challenge.name);
  if (!title) {
    missingData.push({
      field: 'name',
      requirement: 'Provide challenge name.',
    });
  }

  const description = asString(challenge.description);
  if (!description) {
    missingData.push({
      field: 'description',
      requirement: 'Provide a challenge description string.',
    });
  }

  const durationDays = asNumber(challenge.duration_days);
  if (!durationDays) {
    missingData.push({
      field: 'duration_days',
      requirement: 'Provide duration_days as a positive number.',
    });
  }

  const activities = mapActivities(challenge, missingData);
  const locations = mapLocations(challenge.locations, missingData);
  const days = mapDays(challenge.days, challenge.cycle_days, activities, missingData);

  const dominantActivity = determineDominantActivity(challenge, activities);
  if (!dominantActivity) {
    missingData.push({
      field: 'activities.type',
      requirement: 'At least one valid activity type is required for gradient and icons.',
    });
  }

  if (missingData.length > 0 || !dominantActivity || !durationDays) {
    return {
      ok: false,
      missingData,
    };
  }

  return {
    ok: true,
    missingData,
    value: {
      title,
      description,
      durationDays,
      membersJoined: getMembersJoined(challenge),
      locations,
      activities,
      dominantActivity,
      authorName: getAuthorName(challenge),
      days,
    },
  };
}
