import { toFeedPostViewModel, toFeedPostViewModels } from '../feedAdapter';
import type { FeedPostContract } from '../../../types/feed';

const basePost = (overrides: Partial<FeedPostContract> = {}): FeedPostContract => ({
  id: '1',
  user_id: 'user-1',
  user_name: 'alice',
  challenge_id: 'challenge-1',
  challenge_name: 'August Challenge',
  challenge_day: 3,
  posted_at: '2026-09-08T10:00:00.000Z',
  ...overrides,
});

describe('toFeedPostViewModel — reactions/comments (Bloque 3)', () => {
  it('defaults likesCount/commentsCount to 0 and likedByMe to false when the backend omits them', () => {
    const vm = toFeedPostViewModel(basePost());

    expect(vm.likesCount).toBe(0);
    expect(vm.likedByMe).toBe(false);
    expect(vm.commentsCount).toBe(0);
  });

  it('carries through real counts and the viewer-reacted flag', () => {
    const vm = toFeedPostViewModel(
      basePost({ likes_count: 5, liked_by_me: true, comments_count: 2 }),
    );

    expect(vm.likesCount).toBe(5);
    expect(vm.likedByMe).toBe(true);
    expect(vm.commentsCount).toBe(2);
  });

  it('treats liked_by_me: false distinctly from an omitted field (both resolve to false)', () => {
    const vm = toFeedPostViewModel(basePost({ liked_by_me: false }));
    expect(vm.likedByMe).toBe(false);
  });
});

describe('toFeedPostViewModels', () => {
  it('maps every post in the list independently', () => {
    const posts = [
      basePost({ id: '1', likes_count: 1 }),
      basePost({ id: '2', likes_count: 9, liked_by_me: true }),
    ];

    const vms = toFeedPostViewModels(posts);

    expect(vms.map((v) => v.id)).toEqual(['1', '2']);
    expect(vms[1].likesCount).toBe(9);
    expect(vms[1].likedByMe).toBe(true);
  });
});
