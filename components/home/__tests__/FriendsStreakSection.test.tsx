import { act, fireEvent } from '@testing-library/react-native';
import { renderWithTheme as render } from '../../../test-utils/renderWithTheme';
import { IMAGES_READY_TIMEOUT_MS } from '../../../hooks/useImagesReady';
import { FriendsStreakSection } from '../FriendsStreakSection';
import type { FriendStreakViewModel } from '../../../services/adapters/followAdapter';

// Sprint 10: the streaks row stays a skeleton until every profile picture is on screen.
describe('FriendsStreakSection', () => {
  const FRIENDS: FriendStreakViewModel[] = [
    { userId: '1', username: 'ana', avatarUrl: 'https://cdn.test/ana.jpg', streakDays: 4, loggedToday: true },
    { userId: '2', username: 'luis', avatarUrl: 'https://cdn.test/luis.jpg', streakDays: 2, loggedToday: false },
  ];
  const HIDDEN = { includeHiddenElements: true };

  it('shows the skeleton until every profile picture has rendered', async () => {
    const screen = await render(<FriendsStreakSection friends={FRIENDS} />);

    expect(screen.getByTestId('friends-streak-skeleton')).toBeTruthy();
    expect(screen.queryByText('ana')).toBeNull();

    await fireEvent(screen.getByLabelText('ana', HIDDEN), 'loadEnd');
    expect(screen.getByTestId('friends-streak-skeleton')).toBeTruthy();

    await fireEvent(screen.getByLabelText('luis', HIDDEN), 'loadEnd');

    expect(screen.queryByTestId('friends-streak-skeleton')).toBeNull();
    expect(screen.getByText('ana')).toBeTruthy();
    expect(screen.getByText('luis')).toBeTruthy();
  });

  it('shows the friends right away when none has a profile picture', async () => {
    const screen = await render(
      <FriendsStreakSection friends={FRIENDS.map((friend) => ({ ...friend, avatarUrl: undefined }))} />,
    );

    expect(screen.queryByTestId('friends-streak-skeleton')).toBeNull();
    expect(screen.getByText('ana')).toBeTruthy();
  });

  it('gives up waiting after the timeout, so a slow photo never blocks the row', async () => {
    jest.useFakeTimers();
    try {
      const screen = await render(<FriendsStreakSection friends={FRIENDS} />);

      await act(async () => {
        jest.advanceTimersByTime(IMAGES_READY_TIMEOUT_MS);
      });

      expect(screen.queryByTestId('friends-streak-skeleton')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
