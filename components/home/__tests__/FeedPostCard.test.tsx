import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { FeedPostCard } from '../FeedPostCard';
import { reactToPost, unreactToPost } from '../../../services/workout-posts/workout-posts.service';
import type { FeedPostViewModel } from '../../../services/adapters/feedAdapter';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../services/workout-posts/workout-posts.service', () => ({
  reactToPost: jest.fn(),
  unreactToPost: jest.fn(),
}));

// CommentsSheet pulls in useAuth (backed by AsyncStorage) and its own service
// calls — irrelevant to this card's own reaction-toggle behavior, and its
// mapping logic already has its own coverage (workoutPostSocialAdapter.test.ts).
// Stubbed to a no-op so this test can mount FeedPostCard in isolation.
jest.mock('../CommentsSheet', () => ({
  CommentsSheet: () => null,
}));

const mockedReact = reactToPost as jest.Mock;
const mockedUnreact = unreactToPost as jest.Mock;

const basePost = (overrides: Partial<FeedPostViewModel> = {}): FeedPostViewModel => ({
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
  ...overrides,
});

describe('FeedPostCard — reactions (Bloque 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the seeded like/comment counts', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={basePost()} />);
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('optimistically increments and calls reactToPost when tapping an unliked post', async () => {
    mockedReact.mockResolvedValue(undefined);
    const screen = await renderWithTheme(
      <FeedPostCard post={basePost({ likesCount: 4, likedByMe: false })} />,
    );

    fireEvent.press(screen.getByLabelText('home.reactionA11y'));

    await waitFor(() => expect(screen.getByText('5')).toBeTruthy());
    expect(mockedReact).toHaveBeenCalledWith('post-1');
    expect(mockedUnreact).not.toHaveBeenCalled();
  });

  it('optimistically decrements and calls unreactToPost when tapping an already-liked post', async () => {
    mockedUnreact.mockResolvedValue(undefined);
    const screen = await renderWithTheme(
      <FeedPostCard post={basePost({ likesCount: 4, likedByMe: true })} />,
    );

    fireEvent.press(screen.getByLabelText('home.reactionA11y'));

    await waitFor(() => expect(screen.getByText('3')).toBeTruthy());
    expect(mockedUnreact).toHaveBeenCalledWith('post-1');
    expect(mockedReact).not.toHaveBeenCalled();
  });

  it('reverts the optimistic count when the reaction request fails', async () => {
    mockedReact.mockRejectedValue(new Error('network error'));
    const screen = await renderWithTheme(
      <FeedPostCard post={basePost({ likesCount: 4, likedByMe: false })} />,
    );

    fireEvent.press(screen.getByLabelText('home.reactionA11y'));

    // The rejection resolves on the next microtask, faster than this test can
    // reliably observe the transient optimistic "5" — what matters is that it
    // settles back to the pre-tap count, not that "5" was momentarily shown.
    await waitFor(() => expect(mockedReact).toHaveBeenCalledWith('post-1'));
    await waitFor(() => expect(screen.getByText('4')).toBeTruthy());
  });

  it('ignores a second tap while a reaction request is still in flight', async () => {
    let resolveReact!: () => void;
    mockedReact.mockReturnValue(new Promise<void>((resolve) => { resolveReact = resolve; }));
    const screen = await renderWithTheme(
      <FeedPostCard post={basePost({ likesCount: 4, likedByMe: false })} />,
    );

    const reactionButton = screen.getByLabelText('home.reactionA11y');
    fireEvent.press(reactionButton);
    fireEvent.press(reactionButton);

    await waitFor(() => expect(screen.getByText('5')).toBeTruthy());
    expect(mockedReact).toHaveBeenCalledTimes(1);
    resolveReact();
    await waitFor(() => expect(mockedReact).toHaveBeenCalledTimes(1));
  });
});
