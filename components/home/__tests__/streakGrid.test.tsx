import { fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { StreakGridItem } from '../StreakGridItem';
import { StreaksGridSkeleton } from '../StreaksGridSkeleton';
import { STREAK_GRID_COLUMNS } from '../../../constants/streaksGrid';
import { getStreakGridLayout } from '../../../utils/streaksGrid';

jest.mock('expo-router', () => {
  const router = { push: jest.fn() };
  return { router, useRouter: () => router };
});

const { avatarSize } = getStreakGridLayout(390);

describe('StreakGridItem', () => {
  const render = () =>
    renderWithTheme(<StreakGridItem userId="u-alice" username="alice" streakDays={7} loggedToday={false} size={avatarSize} />);

  // Sprint 10: tapping a friend opens their profile.
  it('opens the friend’s profile when tapped', async () => {
    const screen = await render();
    await fireEvent.press(screen.getByTestId('streak-grid-item-u-alice'));
    expect(router.push).toHaveBeenCalledWith('/profile/u-alice');
  });

  it('shows the friend’s name and streak', async () => {
    const screen = await render();

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('has a round avatar, as big as it is told', async () => {
    const json = JSON.stringify((await render()).toJSON());

    expect(json).toContain(`"width":${avatarSize},"height":${avatarSize},"borderRadius":${avatarSize / 2}`);
    // Not the `big` radius that made a big avatar a rounded square.
    expect(avatarSize / 2).toBeGreaterThan(28);
  });
});

describe('StreaksGridSkeleton', () => {
  it('is round blocks the size of the tiles, in as many columns as the grid has', async () => {
    const json = JSON.stringify((await renderWithTheme(<StreaksGridSkeleton avatarSize={avatarSize} />)).toJSON());

    // Two rows of the grid's columns.
    expect(json.match(new RegExp(`"width":${avatarSize},"borderRadius":${avatarSize / 2}`, 'g'))).toHaveLength(
      STREAK_GRID_COLUMNS * 2,
    );
    expect(json).toContain(`"width":"${100 / STREAK_GRID_COLUMNS}%"`);
  });
});
