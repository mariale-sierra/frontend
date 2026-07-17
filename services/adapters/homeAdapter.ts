import { asString, asNumber, asBoolean, normalizeKey } from './adapterUtils';
import type { ActivityType } from '../../constants/theme';
import type { ChallengeContract, ChallengeProgressContract } from '../../types/challenge';

export interface HomeActiveChallengeViewModel {
  challengeId: string;
  title: string;
  currentDay: number;
  totalDays: number;
  isTodayCompleted: boolean;
  isCompleted: boolean;
  activityType: ActivityType;
  isRestDay: boolean;
}


function normalizeToActivityType(value: string): ActivityType | null {
  const map: Record<string, ActivityType> = {
    strength: 'strength',
    cardiointense: 'cardioIntense',
    cardiolow: 'cardioLow',
    flexibility: 'flexibility',
    mindbody: 'mindBody',
    functional: 'functional',
  };
  return map[normalizeKey(value)] ?? null;
}

function pickActivityType(challenge: ChallengeContract): ActivityType {
  const fromActivities = Array.isArray(challenge.activities)
    ? challenge.activities
        .map((item) => normalizeToActivityType(asString(item?.type)))
        .find((type): type is ActivityType => Boolean(type))
    : null;

  if (fromActivities) return fromActivities;

  const fromCategories = Array.isArray(challenge.categories)
    ? challenge.categories
        .map((cat) => normalizeToActivityType(asString(cat)))
        .find((type): type is ActivityType => Boolean(type))
    : null;

  return fromCategories ?? 'strength';
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

function pickIsTodayCompleted(challenge: ChallengeContract): boolean {
  const candidates: Array<unknown> = [
    challenge.today_completed,
    challenge.is_today_completed,
    challenge.current_day_completed,
    challenge.day_completed,
  ];

  for (const candidate of candidates) {
    const value = asBoolean(candidate);
    if (value != null) return value;
  }

  return false;
}

function pickIsCompleted(challenge: ChallengeContract, currentDay: number, totalDays: number): boolean {
  const candidates: Array<unknown> = [challenge.is_completed, challenge.completed];

  for (const candidate of candidates) {
    const value = asBoolean(candidate);
    if (value != null) return value;
  }

  const status = asString(challenge.status || challenge.challenge_status).toLowerCase();
  if (status.includes('completed') || status.includes('finished')) return true;

  return currentDay >= totalDays;
}

function isJoinedOrCompleted(challenge: ChallengeContract): boolean {
  const completedCandidates: Array<unknown> = [challenge.is_completed, challenge.completed];
  for (const c of completedCandidates) {
    if (asBoolean(c) === true) return true;
  }

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
  if (
    status.includes('active') ||
    status.includes('progress') ||
    status.includes('ongoing') ||
    status.includes('completed') ||
    status.includes('finished')
  ) return true;
  if (
    status.includes('archived') ||
    status.includes('closed') ||
    status.includes('left') ||
    status.includes('quit') ||
    status.includes('abandoned') ||
    status.includes('dropped')
  ) return false;

  const currentDay = pickCurrentDay(challenge);
  const duration = asNumber(challenge.duration_days) ?? 0;
  return duration > 0 && currentDay > 0;
}

function pickIsRestDay(challenge: ChallengeContract): boolean {
  const direct = asBoolean(
    challenge.today_is_rest_day ?? challenge.is_rest_day_today ?? challenge.is_rest_day,
  );
  if (direct != null) return direct;
  return false;
}

export function toHomeActiveChallengeViewModel(challenge: ChallengeContract): HomeActiveChallengeViewModel {
  const currentDay = pickCurrentDay(challenge);
  const totalDays = asNumber(challenge.duration_days) ?? 1;

  return {
    challengeId: String(challenge.id),
    title: asString(challenge.name) || 'Challenge',
    currentDay,
    totalDays,
    isTodayCompleted: pickIsTodayCompleted(challenge),
    isCompleted: pickIsCompleted(challenge, currentDay, totalDays),
    activityType: pickActivityType(challenge),
    isRestDay: pickIsRestDay(challenge),
  };
}

export function progressToHomeActiveChallengeViewModel(
  progress: ChallengeProgressContract,
): HomeActiveChallengeViewModel {
  const currentDay = progress.currentDay ?? 1;
  const totalDays = progress.totalDays;

  return {
    challengeId: String(progress.challenge.id),
    title: progress.challenge.name,
    currentDay,
    totalDays,
    isTodayCompleted: progress.completedToday ?? false,
    isCompleted: currentDay >= totalDays,
    activityType: 'strength',
    isRestDay: (progress as Record<string, unknown>).today_is_rest_day === true,
  };
}

export function getHomeChallengesSorted(challenges: ChallengeContract[]): HomeActiveChallengeViewModel[] {
  const vms = challenges.filter(isJoinedOrCompleted).map(toHomeActiveChallengeViewModel);

  const active = vms
    .filter((vm) => !vm.isCompleted)
    .sort((a, b) => (a.totalDays - a.currentDay) - (b.totalDays - b.currentDay));

  const completed = vms.filter((vm) => vm.isCompleted);

  return [...active, ...completed];
}
