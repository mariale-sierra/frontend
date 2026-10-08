import { StyleSheet } from 'react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { FeedPostCard } from '../FeedPostCard';
import { spacing } from '../../../constants/theme';
import type { FeedPostViewModel } from '../../../services/adapters/feedAdapter';

// The share/reactors sheets fetch on their own (chats/users services);
// this card's tests only care that they're wired, not what they load.
jest.mock('../../social/ShareToChatSheet', () => ({ ShareToChatSheet: () => null }));
jest.mock('../../social/ReactorsSheet', () => ({ ReactorsSheet: () => null }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ userId: 'viewer-1' }),
}));
// The report sheet's service would otherwise pull in the real axios client.
jest.mock('../../../services/reports/reports.service', () => ({ createReport: jest.fn() }));
jest.mock('../../../services/workout-posts/workout-posts.service', () => ({
  reactToPost: jest.fn(),
  unreactToPost: jest.fn(),
}));
jest.mock('../../reports/ReportReasonSheet', () => ({
  ReportReasonSheet: () => null,
}));
jest.mock('../PostOptionsSheet', () => ({
  PostOptionsSheet: () => null,
}));
jest.mock('../CommentsSheet', () => ({
  CommentsSheet: () => null,
}));
// B4's delete confirmation — closed by default, irrelevant to layout.
jest.mock('../../ui/confirmationPopup', () => ({
  ConfirmationPopup: () => null,
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
  recentReactors: [],
  hashtags: [],
};

describe('FeedPostCard — the like / comment row', () => {
  // Walks up from the like button to the first ancestor with a top margin: the row that
  // holds the actions.
  function actionsRow(screen: Awaited<ReturnType<typeof renderWithTheme>>) {
    let node = screen.getByLabelText('home.reactionA11y').parent;
    while (node && StyleSheet.flatten(node.props.style)?.marginTop === undefined) node = node.parent;
    return node;
  }

  it('sits a clear gap (spacing.md) below the post, on top of the card’s own gap', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={post} />);

    expect(StyleSheet.flatten(actionsRow(screen)?.props.style).marginTop).toBe(spacing.md);
  });
});

describe('FeedPostCard — stays in sync with refreshed data (B5)', () => {
  it('shows the challenge the post belongs to', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={post} />);
    expect(screen.getByTestId('post-challenge')).toBeTruthy();
  });

  it('picks up new counts when the feed refreshes the same post', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={post} />);
    expect(screen.getByText('2')).toBeTruthy();

    await screen.rerender(<FeedPostCard post={{ ...post, commentsCount: 5 }} />);

    expect(screen.getByText('5')).toBeTruthy();
  });
});
