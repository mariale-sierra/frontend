import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { FeedPostCard } from '../FeedPostCard';
import { deleteWorkoutPost, reactToPost, unreactToPost } from '../../../services/workout-posts/workout-posts.service';
import type { FeedPostViewModel } from '../../../services/adapters/feedAdapter';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
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
  deleteWorkoutPost: jest.fn(),
}));

// CommentsSheet pulls in useAuth (backed by AsyncStorage) and its own service
// calls — irrelevant to this card's own reaction-toggle behavior, and its
// mapping logic already has its own coverage (workoutPostSocialAdapter.test.ts).
// Stubbed to a no-op so this test can mount FeedPostCard in isolation.
jest.mock('../../reports/ReportReasonSheet', () => ({
  ReportReasonSheet: () => null,
}));
// Minimal stand-ins exposing only what this card wires into them: which
// options the sheet offers (B4: Delete on your own post, Report on anyone
// else's) and the confirmation popup's buttons.
jest.mock('../PostOptionsSheet', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    PostOptionsSheet: ({ visible, onReport, onDelete }: { visible: boolean; onReport?: () => void; onDelete?: () => void }) =>
      visible
        ? React.createElement(
            React.Fragment,
            null,
            onReport
              ? React.createElement(Pressable, { testID: 'post-options-report', onPress: onReport }, React.createElement(Text, null, 'report'))
              : null,
            onDelete
              ? React.createElement(Pressable, { testID: 'post-options-delete', onPress: onDelete }, React.createElement(Text, null, 'delete'))
              : null,
          )
        : null,
  };
});
jest.mock('../../ui/confirmationPopup', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    ConfirmationPopup: ({
      visible,
      title,
      primaryButton,
      secondaryButton,
    }: {
      visible: boolean;
      title: string;
      primaryButton: { label: string; onPress: () => void };
      secondaryButton?: { label: string; onPress: () => void };
    }) =>
      visible
        ? React.createElement(
            View,
            null,
            React.createElement(Text, null, title),
            React.createElement(Pressable, { testID: 'confirm-primary', onPress: primaryButton.onPress }, React.createElement(Text, null, primaryButton.label)),
            secondaryButton
              ? React.createElement(Pressable, { testID: 'confirm-secondary', onPress: secondaryButton.onPress }, React.createElement(Text, null, secondaryButton.label))
              : null,
          )
        : null,
  };
});
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

describe('FeedPostCard — send message action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the "Message" action for another user\'s post', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={basePost({ userId: 'user-1' })} />);
    expect(screen.queryByText('home.sendMessage')).toBeTruthy();
  });

  // Real, reported bug: this showed on your own posts too, and tapping it
  // tried to open a conversation with yourself — the backend rejects that
  // (getOrCreateConversation: "You cannot start a conversation with
  // yourself"), so it just silently failed.
  it('hides the "Message" action for your own post', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={basePost({ userId: 'viewer-1' })} />);
    expect(screen.queryByText('home.sendMessage')).toBeNull();
  });
});

describe('FeedPostCard — options menu', () => {
  it('shows the "..." options button on another user\'s post', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={basePost({ userId: 'user-1' })} />);
    expect(screen.queryByTestId('post-options')).toBeTruthy();
  });

  // B4: your own post has a menu too — with Delete instead of Report (you
  // still can't report yourself).
  it('offers Delete, never Report, on your own post', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={basePost({ userId: 'viewer-1' })} />);
    await fireEvent.press(screen.getByTestId('post-options'));
    expect(screen.queryByTestId('post-options-delete')).toBeTruthy();
    expect(screen.queryByTestId('post-options-report')).toBeNull();
  });

  it('offers Report, never Delete, on someone else\'s post', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={basePost({ userId: 'user-1' })} />);
    await fireEvent.press(screen.getByTestId('post-options'));
    expect(screen.queryByTestId('post-options-report')).toBeTruthy();
    expect(screen.queryByTestId('post-options-delete')).toBeNull();
  });
});

describe('FeedPostCard — deleting your own post (B4)', () => {
  const mockedDelete = deleteWorkoutPost as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('asks for confirmation before deleting anything', async () => {
    const screen = await renderWithTheme(<FeedPostCard post={basePost({ userId: 'viewer-1' })} />);
    await fireEvent.press(screen.getByTestId('post-options'));
    await fireEvent.press(screen.getByTestId('post-options-delete'));

    await waitFor(() => expect(screen.getByText('home.postOptions.deleteConfirmTitle')).toBeTruthy());
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('deletes and reports the post id to the list once confirmed', async () => {
    mockedDelete.mockResolvedValue(undefined);
    const onDeleted = jest.fn();
    const screen = await renderWithTheme(<FeedPostCard post={basePost({ userId: 'viewer-1' })} onDeleted={onDeleted} />);
    await fireEvent.press(screen.getByTestId('post-options'));
    await fireEvent.press(screen.getByTestId('post-options-delete'));
    await waitFor(() => expect(screen.getByTestId('confirm-primary')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('confirm-primary'));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('post-1'));
    expect(mockedDelete).toHaveBeenCalledWith('post-1');
  });

  it('cancelling deletes nothing', async () => {
    const onDeleted = jest.fn();
    const screen = await renderWithTheme(<FeedPostCard post={basePost({ userId: 'viewer-1' })} onDeleted={onDeleted} />);
    await fireEvent.press(screen.getByTestId('post-options'));
    await fireEvent.press(screen.getByTestId('post-options-delete'));
    await waitFor(() => expect(screen.getByTestId('confirm-secondary')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('confirm-secondary'));

    expect(mockedDelete).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-primary')).toBeNull();
  });

  it('keeps the post when the delete request fails', async () => {
    mockedDelete.mockRejectedValue(new Error('network'));
    const onDeleted = jest.fn();
    const screen = await renderWithTheme(<FeedPostCard post={basePost({ userId: 'viewer-1' })} onDeleted={onDeleted} />);
    await fireEvent.press(screen.getByTestId('post-options'));
    await fireEvent.press(screen.getByTestId('post-options-delete'));
    await waitFor(() => expect(screen.getByTestId('confirm-primary')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('confirm-primary'));

    await waitFor(() => expect(mockedDelete).toHaveBeenCalled());
    expect(onDeleted).not.toHaveBeenCalled();
  });
});

// Placed after "send message action" above — the last two tests here
// ("reverts the optimistic count"/"ignores a second tap") each leave a
// promise continuation that lands a state update on their own
// already-unmounted render after the test itself has finished (a
// pre-existing "not wrapped in act()" warning, unrelated to this file's
// actual assertions); whatever test runs immediately after inherits that
// stray update mid-render. Keeping unrelated describe blocks ahead of this
// one avoids being that unlucky next test.
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
