import { openPostViewer } from '../postViewer';
import { usePostViewerStore } from '../../store/postViewerStore';
import type { ChallengePhoto } from '../../types/challenge';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const photo = (id: string, overrides: Partial<ChallengePhoto> = {}): ChallengePhoto => ({
  id,
  challengeId: 'ch-1',
  userName: 'me',
  imageUrl: null,
  day: 1,
  visibility: 'private',
  metrics: [],
  description: '',
  ...overrides,
});

describe('openPostViewer', () => {
  it('stamps your own posts with your id, so their menu offers Delete even without userId from the API', () => {
    openPostViewer([photo('a'), photo('b')], photo('b'), { ownerId: 'me-1' });
    const { posts, startId } = usePostViewerStore.getState();
    expect(posts.map((p) => p.userId)).toEqual(['me-1', 'me-1']);
    expect(posts[0].visibility).toBe('private');
    expect(startId).toBe('b');
  });

  it("leaves someone else's posts as they are, without visibility", () => {
    openPostViewer([photo('a', { userId: 'other-1' })], photo('a'));
    const [post] = usePostViewerStore.getState().posts;
    expect(post.userId).toBe('other-1');
    expect(post.visibility).toBeUndefined();
  });
});
