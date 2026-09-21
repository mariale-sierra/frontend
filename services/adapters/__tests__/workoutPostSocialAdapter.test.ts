import { toCommentThread, toCommentViewModel, toCommentViewModels } from '../workoutPostSocialAdapter';
import type { CommentContract } from '../../../types/workout-post-social';

const baseComment = (overrides: Partial<CommentContract> = {}): CommentContract => ({
  id: 1,
  workoutPostId: 'post-1',
  author: {
    id: 'user-1',
    username: 'bob',
    displayName: null,
    profileImageUrl: null,
  },
  content: 'Nice work!',
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('toCommentViewModel', () => {
  it('prefers the author displayName over username when present', () => {
    const vm = toCommentViewModel(
      baseComment({ author: { id: 'u1', username: 'bob', displayName: 'Bob R.', profileImageUrl: null } }),
    );
    expect(vm.authorName).toBe('Bob R.');
  });

  it('falls back to username when displayName is null', () => {
    const vm = toCommentViewModel(baseComment());
    expect(vm.authorName).toBe('bob');
  });

  it('falls back to "Unknown" when neither displayName nor username is present', () => {
    const vm = toCommentViewModel(
      baseComment({ author: { id: 'u1', username: '', displayName: null, profileImageUrl: null } }),
    );
    expect(vm.authorName).toBe('Unknown');
  });

  it('maps profileImageUrl null to undefined (UserAvatar expects an optional prop)', () => {
    const vm = toCommentViewModel(baseComment());
    expect(vm.authorAvatarUrl).toBeUndefined();
  });

  it('carries the author id through for own-comment (delete button) checks', () => {
    const vm = toCommentViewModel(baseComment({ author: { id: 'user-42', username: 'x', displayName: null, profileImageUrl: null } }));
    expect(vm.authorId).toBe('user-42');
  });
});

describe('toCommentViewModels', () => {
  it('maps every comment in the list independently, preserving order', () => {
    const comments = [baseComment({ id: 1 }), baseComment({ id: 2 })];
    const vms = toCommentViewModels(comments);
    expect(vms.map((v) => v.id)).toEqual([1, 2]);
  });
});

describe('toCommentThread', () => {
  it('turns the API\'s oldest-first list round, so the newest comment is first: a stack', () => {
    const thread = toCommentThread([baseComment({ id: 1 }), baseComment({ id: 2 }), baseComment({ id: 3 })]);

    expect(thread.map((comment) => comment.id)).toEqual([3, 2, 1]);
  });

  it('maps each comment as `toCommentViewModel` does', () => {
    const [comment] = toCommentThread([baseComment({ id: 7, content: 'Great!' })]);

    expect(comment).toEqual(toCommentViewModel(baseComment({ id: 7, content: 'Great!' })));
  });

  it('is empty for no comments, and leaves the list it was given as it was', () => {
    const given = [baseComment({ id: 1 }), baseComment({ id: 2 })];

    expect(toCommentThread([])).toEqual([]);
    toCommentThread(given);
    expect(given.map((comment) => comment.id)).toEqual([1, 2]);
  });
});
