import { challengePhotoToFeedPost } from '../feedAdapter';
import type { ChallengePhoto } from '../../../types/challenge';

const photo = (overrides: Partial<ChallengePhoto> = {}): ChallengePhoto => ({
  id: 'p-1',
  challengeId: 'ch-1',
  userName: 'ana',
  imageUrl: 'https://example.com/a.jpg',
  day: 3,
  visibility: 'private',
  metrics: [{ label: 'Plancha', value: '60 s' }],
  description: 'Día 3 #core',
  ...overrides,
});

describe('challengePhotoToFeedPost (B5)', () => {
  it('carries what a feed card needs from an enriched profile photo', () => {
    const vm = challengePhotoToFeedPost(
      photo({
        userId: 'u-1',
        userAvatarUrl: 'https://example.com/me.jpg',
        challengeName: 'Core 30',
        likesCount: 2,
        likedByMe: true,
        commentsCount: 5,
        recentReactors: [{ id: 'u-2', username: 'bob', displayName: 'Bob', profileImageUrl: null }],
        hashtags: ['core'],
      }),
    );
    expect(vm).toEqual(
      expect.objectContaining({
        id: 'p-1',
        userId: 'u-1',
        challengeName: 'Core 30',
        caption: 'Día 3 #core',
        likesCount: 2,
        likedByMe: true,
        commentsCount: 5,
        hashtags: ['core'],
        metrics: [{ label: 'Plancha', value: '60 s' }],
        visibility: 'private',
      }),
    );
    expect(vm.recentReactors).toEqual([{ id: 'u-2', username: 'bob', displayName: 'Bob', avatarUrl: null }]);
  });

  it('degrades to zero counts for an older API without the new fields', () => {
    const vm = challengePhotoToFeedPost(photo());
    expect(vm.likesCount).toBe(0);
    expect(vm.commentsCount).toBe(0);
    expect(vm.recentReactors).toEqual([]);
  });
});
