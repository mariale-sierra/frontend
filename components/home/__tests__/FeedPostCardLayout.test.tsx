import { StyleSheet } from 'react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { FeedPostCard } from '../FeedPostCard';
import { spacing } from '../../../constants/theme';
import type { FeedPostViewModel } from '../../../services/adapters/feedAdapter';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ userId: 'viewer-1' }),
}));
jest.mock('../../../services/workout-posts/workout-posts.service', () => ({
  reactToPost: jest.fn(),
  unreactToPost: jest.fn(),
}));
jest.mock('../CommentsSheet', () => ({
  CommentsSheet: () => null,
}));

// Its own file: the reaction tests in FeedPostCard.test.tsx leave React's act
// environment mid-flight, which this render must not inherit.
const post: FeedPostViewModel = {
  id: 'post-1',
  userId: 'user-1',
  userName: 'alice',
  challengeId: 'challenge-1',
  challengeName: 'August Challenge',
  day: 3,
  postedAt: '2h',
  likesCount: 4,
  likedByMe: false,
  commentsCount: 2,
};

describe('FeedPostCard — the like / comment row', () => {
  // Walks up from the like count to the first ancestor with a top margin: the row that
  // holds the actions.
  function actionsRow(screen: Awaited<ReturnType<typeof renderWithTheme>>) {
    let node = screen.getByText('4').parent;
    while (node && StyleSheet.flatten(node.props.style)?.marginTop === undefined) node = node.parent;
    return node;
  }

  it('sits a clear gap (spacing.md) below the post, on top of the card’s own gap', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={post} />);

    expect(StyleSheet.flatten(actionsRow(screen)?.props.style).marginTop).toBe(spacing.md);
  });
});
