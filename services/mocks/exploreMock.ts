import type { ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';

// REMOVE_MOCK_START: delete when icon stack testing is complete
export function buildMockExploreChallenges(): ExploreChallengeViewModel[] {
  return [
    {
      challengeId: 'mock-single',
      title: 'Iron Will',
      subtitle: 'ChallengeApp · 142 members',
      activityType: 'strength',
      durationDays: 30,
      locationLabel: 'Any location',
    },
    {
      challengeId: 'mock-double',
      title: 'Cardio & Flex',
      subtitle: 'MoveFast · 88 members',
      activityType: 'cardioIntense',
      secondaryActivityType: 'flexibility',
      durationDays: 21,
      locationLabel: 'Gym',
    },
    {
      challengeId: 'mock-triple',
      title: 'Total Body Burn',
      subtitle: 'FitSquad · 210 members',
      activityType: 'functional',
      secondaryActivityType: 'cardioLow',
      tertiaryActivityType: 'mindBody',
      durationDays: 45,
      locationLabel: 'Outdoor',
    },
  ];
}
// REMOVE_MOCK_END
