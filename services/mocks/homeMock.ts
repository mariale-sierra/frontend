import type { HomeActiveChallengeViewModel } from '../adapters/homeAdapter';

// REMOVE_MOCK_START: delete when backend provides active challenge data.
export function buildMockHomeChallenges(): HomeActiveChallengeViewModel[] {
  return [
    {
      challengeId: '1',
      title: 'Seventy-Five Hard Challenge',
      currentDay: 72,
      totalDays: 75,
      isTodayCompleted: false,
      isCompleted: false,
      activityType: 'strength',
      isRestDay: false,
    },
    {
      challengeId: '2',
      title: 'Thirty Day Flex',
      currentDay: 18,
      totalDays: 30,
      isTodayCompleted: true,
      isCompleted: false,
      activityType: 'flexibility',
      isRestDay: false,
    },
    {
      challengeId: '3',
      title: 'Morning Cardio 21',
      currentDay: 21,
      totalDays: 21,
      isTodayCompleted: true,
      isCompleted: true,
      activityType: 'cardioLow',
      isRestDay: false,
    },
  ];
}
// REMOVE_MOCK_END
