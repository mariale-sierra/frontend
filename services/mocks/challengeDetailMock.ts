import type { ChallengeDetailViewModel } from '../adapters/challengeDetailAdapter';

export function buildMockChallengeDetailViewModel(): ChallengeDetailViewModel {
  return {
    title: 'Full Body Reset',
    description:
      'Build consistency with a balanced progression that combines strength training, mobility, and conditioning. Each session is structured to keep intensity sustainable while still pushing adaptation. Follow the plan daily, track your effort, and repeat each week pattern until the challenge ends.',
    durationDays: 30,
    membersJoined: 184,
    locations: ['home', 'gym'],
    activities: [
      { activityType: 'strength', label: 'Strength training' },
      { activityType: 'functional', label: 'Functional conditioning' },
      { activityType: 'flexibility', label: 'Mobility and flexibility' },
    ],
    dominantActivity: 'strength',
    days: [
      { day: 1, title: 'Lower Body Power', description: 'Compound lower-body session focused on squat and hinge patterns.', activities: ['strength'] },
      { day: 2, title: 'Core and Stability', description: 'Midline control, anti-rotation work, and posture endurance.', activities: ['functional'] },
      { day: 3, title: 'Upper Body Push', description: 'Pressing volume with controlled tempo and accessory finishing.', activities: ['strength'] },
      { day: 4, title: 'Mobility Flow', description: 'Longer flexibility block to recover range and tissue quality.', activities: ['flexibility'] },
      { day: 5, title: 'Upper Body Pull', description: 'Pulling mechanics, scapular control, and grip endurance.', activities: ['strength'] },
      { day: 6, title: 'Conditioning Circuit', description: 'Functional full-body circuits with short rests and pacing.', activities: ['functional'] },
      { day: 7, title: 'Recovery Mobility', description: 'Reduced intensity movement prep and breath-led recovery.', activities: ['flexibility'] },
      { day: 8, title: 'Lower Body Volume', description: 'Higher-rep leg work plus posterior chain accessories.', activities: ['strength'] },
      { day: 9, title: 'Athletic Engine', description: 'Tempo-based conditioning intervals for work capacity.', activities: ['functional'] },
      { day: 10, title: 'Mobility Reset', description: 'Deep flexibility progressions to improve control and range.', activities: ['flexibility'] },
    ],
  };
}
