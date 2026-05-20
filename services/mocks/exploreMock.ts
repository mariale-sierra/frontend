import type { ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';

// REMOVE_MOCK_START: delete when icon stack testing is complete
export function buildMockExploreChallenges(): ExploreChallengeViewModel[] {
  return [
    {
      challengeId: 'mock-single',
      title: 'Iron Will',
      subtitle: 'ChallengeApp · 142 members',
      activityType: 'strength',
      durationLabel: '30 days',
      locationLabel: 'Any location',
    },
    {
      challengeId: 'mock-double',
      title: 'Cardio & Flex',
      subtitle: 'MoveFast · 88 members',
      activityType: 'cardioIntense',
      secondaryActivityType: 'flexibility',
      durationLabel: '21 days',
      locationLabel: 'Gym',
    },
    {
      challengeId: 'mock-triple',
      title: 'Total Body Burn',
      subtitle: 'FitSquad · 210 members',
      activityType: 'functional',
      secondaryActivityType: 'cardioLow',
      tertiaryActivityType: 'mindBody',
      durationLabel: '45 days',
      locationLabel: 'Outdoor',
    },
  ];
}
// REMOVE_MOCK_END
