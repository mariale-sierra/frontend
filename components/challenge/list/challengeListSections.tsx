import type { ActivityType } from '../../../types/activity';

// View-model types shared across the challenge-list screens/adapter. The
// `ChallengeListSections` component that used to live in this file (mixed
// active+explore sections with "see all" headers) is retired — the
// Challenges tab (app/(tabs)/challenges.tsx) now shows Mine/Explore as two
// full lists behind a segmented toggle instead, using ChallengeStatusCard /
// ExploreChallengeCard directly. `ActiveChallengeViewModel` is still the
// old card's model, used by app/challenge/active-all.tsx (not yet migrated
// to the new ChallengeStatusCard) — see challengeListAdapter.ts's
// `ChallengeMineCardViewModel` for the new tab's shape.

export interface ActiveChallengeViewModel {
  challengeId: string;
  title: string;
  day: number;
  progressPercent: number;
  streakCount: number;
  activityType: ActivityType;
  secondaryActivityType?: ActivityType;
  tertiaryActivityType?: ActivityType;
  status: 'active' | 'completed' | 'left';
  isRestDay: boolean;
}

export interface ExploreChallengeViewModel {
  challengeId: string;
  title: string;
  durationDays: number;
  cycleLengthDays: number;
  restDaysCount: number;
  locationsLabel: string;
  categoriesLabel: string;
  membersCount: number;
}

export interface ChallengesScreenViewModel {
  activeChallenges: ActiveChallengeViewModel[];
  exploreChallenges: ExploreChallengeViewModel[];
}
