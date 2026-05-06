import type { ActivityType } from '../../constants/theme';
import type {
  ChallengeActivityContract,
  ChallengeContract,
  ChallengeDayContract,
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

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]/g, '');
}

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

function mapActivities(
  activities: ChallengeActivityContract[] | undefined,
  missingData: ChallengeDetailMissingData[],
) {
  if (!Array.isArray(activities) || activities.length === 0) {
    missingData.push({
      field: 'activities',
      requirement: 'Provide activities: { type: string, label: string }[] with full display labels.',
    });
    return [];
  }

  const mapped = activities
    .map((item) => {
      const typeValue = parseActivityType(asString(item.type));
      const labelValue = asString(item.label);

      if (!typeValue || !labelValue) {
        return null;
      }

      return { activityType: typeValue, label: labelValue };
    })
    .filter((item): item is ChallengeActivityBadge => Boolean(item));

  if (mapped.length === 0) {
    missingData.push({
      field: 'activities',
      requirement: 'Provide valid activity entries with supported type and non-empty label.',
    });
  }

  return mapped;
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

function mapDays(
  days: ChallengeDayContract[] | undefined,
  activities: ChallengeActivityBadge[],
  missingData: ChallengeDetailMissingData[],
) {
  if (!Array.isArray(days) || days.length === 0) {
    missingData.push({
      field: 'days',
      requirement: 'Provide days: { day, title, description, activities }[] with real routine data.',
    });
    return [];
  }

  const allowedActivities = new Set(activities.map((item) => item.activityType));

  const mapped = days
    .map((day) => {
      const dayNumber = asNumber(day.day);
      const title = asString(day.title);
      const description = asString(day.description);
      const dayActivities = Array.isArray(day.activities)
        ? unique(
            day.activities
              .map((activity) => parseActivityType(asString(activity)))
              .filter((item): item is ActivityType => Boolean(item) && allowedActivities.has(item)),
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

  if (mapped.length === 0) {
    missingData.push({
      field: 'days',
      requirement: 'Each day must include day number, title, description, and valid activities.',
    });
  }

  return mapped;
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

  const activities = mapActivities(challenge.activities, missingData);
  const locations = mapLocations(challenge.locations, missingData);
  const days = mapDays(challenge.days, activities, missingData);

  const dominantActivity = activities[0]?.activityType;
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
      days,
    },
  };
}
