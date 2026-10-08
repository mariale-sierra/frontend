import { fireEvent } from '@testing-library/react-native';
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
  metrics: [],
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

describe('FeedPostCard — metrics, trophy and visibility (B5)', () => {
  it('has no metrics toggle when nothing was logged', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={post} />);
    expect(screen.queryByTestId('post-metrics-toggle')).toBeNull();
  });

  it('keeps the logged metrics collapsed until their toggle is tapped', async () => {
    const screen = await renderWithTheme(
      <FeedPostCard post={{ ...post, metrics: [{ label: 'Sentadilla', value: '3 × 12 reps' }] }} />,
    );
    expect(screen.queryByTestId('post-metrics')).toBeNull();

    await fireEvent.press(screen.getByTestId('post-metrics-toggle'));

    expect(screen.getByTestId('post-metrics')).toBeTruthy();
    expect(screen.getByText('3 × 12 reps')).toBeTruthy();
  });

  it('puts the trophy in the actions row, with the like and comments', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={post} />);
    const row = actionsRowOf(screen.getByTestId('post-challenge'));
    expect(row).toBe(actionsRowOf(screen.getByLabelText('home.reactionA11y')));
  });

  it('shows the visibility on the photo only when the post carries it (your own posts)', async () => {
    const others = await renderWithTheme(<FeedPostCard post={post} />);
    expect(others.queryByTestId('post-visibility')).toBeNull();
    const own = await renderWithTheme(<FeedPostCard post={{ ...post, visibility: 'private' }} />);
    expect(own.getByTestId('post-visibility')).toBeTruthy();
  });
});

// The nearest ancestor with a top margin: the card's actions row.
function actionsRowOf(node: { parent: unknown; props: { style?: unknown } } | null) {
  let current = node as { parent: unknown; props: { style?: unknown } } | null;
  while (current && StyleSheet.flatten(current.props.style as never)?.marginTop === undefined) {
    current = current.parent as typeof current;
  }
  return current;
}
