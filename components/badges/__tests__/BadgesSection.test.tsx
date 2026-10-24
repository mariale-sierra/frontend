import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { BadgesSection } from '../BadgesSection';
import { getMyBadges, getUserBadges } from '../../../services/badges/badges.service';
import type { BadgeContract } from '../../../types/badge';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));
jest.mock('../../../services/badges/badges.service', () => ({
  getMyBadges: jest.fn(),
  getUserBadges: jest.fn(),
}));

const mockedMine = getMyBadges as jest.Mock;
const mockedUser = getUserBadges as jest.Mock;

const badge = (over: Partial<BadgeContract>): BadgeContract => ({
  code: 'first_workout',
  name: 'Primer entrenamiento',
  description: 'Registra tu primer entrenamiento completado.',
  earned: false,
  progress: 0,
  target: 1,
  ...over,
});

describe('BadgesSection (B12)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads your own badges when no userId is given', async () => {
    mockedMine.mockResolvedValue([badge({ earned: true, progress: 1 })]);
    const screen = await renderWithTheme(<BadgesSection />);

    await waitFor(() => expect(screen.getByText('Primer entrenamiento')).toBeTruthy());
    expect(mockedMine).toHaveBeenCalledTimes(1);
    expect(mockedUser).not.toHaveBeenCalled();
  });

  it('loads another user\'s badges by id', async () => {
    mockedUser.mockResolvedValue([badge({})]);
    const screen = await renderWithTheme(<BadgesSection userId="user-2" />);

    await waitFor(() => expect(screen.getByText('Primer entrenamiento')).toBeTruthy());
    expect(mockedUser).toHaveBeenCalledWith('user-2');
  });

  it('shows earned badges before locked ones', async () => {
    mockedMine.mockResolvedValue([
      badge({ code: 'five_workouts', name: '5 entrenamientos', target: 5 }),
      badge({ code: 'first_workout', name: 'Primer entrenamiento', earned: true, progress: 1 }),
    ]);
    const screen = await renderWithTheme(<BadgesSection />);

    await waitFor(() => expect(screen.getByTestId('badge-first_workout')).toBeTruthy());
    const tiles = screen.getAllByTestId(/^badge-/).map((node) => node.props.testID);
    expect(tiles).toEqual(['badge-first_workout', 'badge-five_workouts']);
  });

  it('renders nothing when the list is empty (private profile) or the request fails', async () => {
    mockedUser.mockResolvedValueOnce([]);
    const empty = await renderWithTheme(<BadgesSection userId="private-user" />);
    await waitFor(() => expect(mockedUser).toHaveBeenCalled());
    expect(empty.queryByText('badges.title')).toBeNull();

    mockedMine.mockRejectedValueOnce(new Error('boom'));
    const failed = await renderWithTheme(<BadgesSection />);
    await waitFor(() => expect(mockedMine).toHaveBeenCalled());
    expect(failed.queryByText('badges.title')).toBeNull();
  });

  it('opens the detail sheet with the criterion and progress when a locked badge is tapped', async () => {
    mockedMine.mockResolvedValue([badge({ code: 'five_workouts', name: '5 entrenamientos', description: 'Completa 5 entrenamientos.', progress: 3, target: 5 })]);
    const screen = await renderWithTheme(<BadgesSection />);

    await waitFor(() => expect(screen.getByTestId('badge-five_workouts')).toBeTruthy());
    fireEvent.press(screen.getByTestId('badge-five_workouts'));

    await waitFor(() => expect(screen.getByText('Completa 5 entrenamientos.')).toBeTruthy());
    expect(screen.getByText('badges.progressOwn')).toBeTruthy();
  });

  // Sprint 10, B2: each badge also says how it is counted (BADGE_CATALOG metric).
  it.each([
    ['five_workouts', 'badges.rules.workouts'],
    ['streak_7_days', 'badges.rules.streak'],
    ['three_challenges_completed', 'badges.rules.challenges'],
  ])('the %s sheet explains its rule (%s)', async (code, rule) => {
    mockedMine.mockResolvedValue([badge({ code, name: code, target: 5 })]);
    const screen = await renderWithTheme(<BadgesSection />);

    await waitFor(() => expect(screen.getByTestId(`badge-${code}`)).toBeTruthy());
    fireEvent.press(screen.getByTestId(`badge-${code}`));

    await waitFor(() => expect(screen.getByTestId('badge-rule')).toBeTruthy());
    expect(screen.getByText(rule)).toBeTruthy();
  });

  it('adds no rule for a badge code this app does not know', async () => {
    mockedMine.mockResolvedValue([badge({ code: 'brand_new', name: 'Nueva', description: 'Algo nuevo.' })]);
    const screen = await renderWithTheme(<BadgesSection />);

    await waitFor(() => expect(screen.getByTestId('badge-brand_new')).toBeTruthy());
    fireEvent.press(screen.getByTestId('badge-brand_new'));

    await waitFor(() => expect(screen.getByText('Algo nuevo.')).toBeTruthy());
    expect(screen.queryByTestId('badge-rule')).toBeNull();
  });

  it('as a grid (the Badges screen): every badge, earned first, under just the earned count', async () => {
    mockedMine.mockResolvedValue([
      badge({ code: 'five_workouts', name: '5 entrenamientos', target: 5 }),
      badge({ code: 'first_workout', name: 'Primer entrenamiento', earned: true, progress: 1 }),
    ]);
    const screen = await renderWithTheme(<BadgesSection layout="grid" />);

    await waitFor(() => expect(screen.getByTestId('badges-grid')).toBeTruthy());
    // The screen has its own title, so the grid has none.
    expect(screen.queryByText('badges.title')).toBeNull();
    const names = screen.getAllByText(/entrenamiento/).map((node) => node.props.children);
    expect(names).toEqual(['Primer entrenamiento', '5 entrenamientos']);
  });
});
