import type { ActiveChallengeViewModel } from '../../components/challenge/list/challengeListSections';

// REMOVE_MOCK_START: delete this file and its import/spread in challenges.tsx once
// the backend returns isRestDay on the enrolled-challenge response.
export function buildMockRestDayChallenges(): ActiveChallengeViewModel[] {
  return [
    {
      challengeId: 'mock-restday-1',
      title: 'Iron Will',
      day: 14,
      progressPercent: 47,
      streakCount: 6,
      activityType: 'strength',
      status: 'active',
      isRestDay: true,
    },
    {
      challengeId: 'mock-restday-2',
      title: 'Morning Cardio 30',
      day: 8,
      progressPercent: 27,
      streakCount: 3,
      activityType: 'cardioIntense',
      status: 'active',
      isRestDay: true,
    },
  ];
}
// REMOVE_MOCK_END
