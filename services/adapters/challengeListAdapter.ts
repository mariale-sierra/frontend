import type { ActiveChallengeViewModel, ChallengesScreenViewModel, ExploreChallengeViewModel } from '../../components/challenges/challengeListSections';
import type { ActivityType } from '../../constants/theme';
import type { ChallengeContract } from '../../types/challenge';

interface ChallengeListLabels {
  membersLabel: string;
  unknownCreatorLabel: string;
  durationLabel: string;
  locationFallbackLabel: string;
  categoryFallbackLabel: string;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'active', 'joined'].includes(normalized)) return true;
  if (['false', '0', 'no', 'inactive', 'left'].includes(normalized)) return false;
  return null;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z]/g, '');
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

function pickActivityType(challenge: ChallengeContract): ActivityType {
  const fromActivities = Array.isArray(challenge.activities)
    ? challenge.activities
        .map((item) => asActivityType(asString(item?.type)))
        .find((type): type is ActivityType => Boolean(type))
    : null;

  if (fromActivities) {
    return fromActivities;
  }

  const fromCategories = Array.isArray(challenge.categories)
    ? challenge.categories
        .map((category) => asActivityType(asString(category)))
        .find((type): type is ActivityType => Boolean(type))
    : null;

  return fromCategories ?? 'strength';
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

function pickMembersCount(challenge: ChallengeContract): number {
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

function pickCreatorName(challenge: ChallengeContract, labels: ChallengeListLabels): string {
  const candidates: Array<unknown> = [
    challenge.created_by_username,
    challenge.creator_name,
    challenge.author_name,
  ];

  for (const candidate of candidates) {
    const value = asString(candidate);
    if (value) {
      return value;
    }
  }

  return labels.unknownCreatorLabel;
}

function pickLocationLabel(challenge: ChallengeContract, labels: ChallengeListLabels): string {
  if (Array.isArray(challenge.locations) && challenge.locations.length > 0) {
    const value = asString(challenge.locations[0]);
    if (value) {
      return value;
    }
  }

  return labels.locationFallbackLabel;
}

function pickCategoryLabel(challenge: ChallengeContract, labels: ChallengeListLabels): string {
  if (Array.isArray(challenge.categories) && challenge.categories.length > 0) {
    const value = asString(challenge.categories[0]);
    if (value) {
      return value;
    }
  }

  return labels.categoryFallbackLabel;
}

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
  return {
    challengeId: String(challenge.id),
    title: asString(challenge.name) || 'Untitled challenge',
    day: pickCurrentDay(challenge),
    progressPercent: pickProgressPercent(challenge),
    streakCount: pickStreakCount(challenge),
    activityType: pickActivityType(challenge),
  };
}

function toExploreCard(challenge: ChallengeContract, labels: ChallengeListLabels): ExploreChallengeViewModel {
  const duration = asNumber(challenge.duration_days) ?? 0;
  const creator = pickCreatorName(challenge, labels);
  const members = pickMembersCount(challenge);

  return {
    challengeId: String(challenge.id),
    title: asString(challenge.name) || 'Untitled challenge',
    subtitle: `${creator} · ${members} ${labels.membersLabel}`,
    activityType: pickActivityType(challenge),
    badges: [
      duration > 0 ? `${duration} ${labels.durationLabel}` : labels.durationLabel,
      pickLocationLabel(challenge, labels),
      pickCategoryLabel(challenge, labels),
    ],
  };
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
