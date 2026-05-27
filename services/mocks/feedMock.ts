import type { FeedPostContract } from '../../types/feed';

// REMOVE_MOCK_START: delete once /feed endpoint is live
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

export function buildMockFeedPosts(): FeedPostContract[] {
  return [
    {
      id: 'feed-mock-1',
      user_id: 'user-1',
      user_name: 'camsandvl',
      challenge_id: 'mock-single',
      challenge_name: 'Iron Will',
      activity_type: 'strength',
      challenge_day: 14,
      caption: 'Day 14 done. Feeling stronger every week.',
      posted_at: hoursAgo(2),
      likes_count: 8,
    },
    {
      id: 'feed-mock-2',
      user_id: 'user-2',
      user_name: 'moveFast',
      challenge_id: 'mock-double',
      challenge_name: 'Cardio & Flex',
      activity_type: 'cardioIntense',
      challenge_day: 7,
      posted_at: hoursAgo(5),
      likes_count: 3,
    },
    {
      id: 'feed-mock-3',
      user_id: 'user-3',
      user_name: 'fitSquad',
      challenge_id: 'mock-triple',
      challenge_name: 'Total Body Burn',
      activity_type: 'functional',
      challenge_day: 22,
      caption: 'Halfway through and the gains are real.',
      posted_at: hoursAgo(18),
      likes_count: 14,
    },
    {
      id: 'feed-mock-4',
      user_id: 'user-4',
      user_name: 'sunriseYogi',
      challenge_id: 'mock-flex',
      challenge_name: 'Morning Stretch',
      activity_type: 'flexibility',
      challenge_day: 3,
      posted_at: hoursAgo(26),
      likes_count: 5,
    },
  ];
}
// REMOVE_MOCK_END
