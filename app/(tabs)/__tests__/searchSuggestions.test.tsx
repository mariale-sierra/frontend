import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import Search from '../search';
import { loadAllChallenges } from '../../../services/cache/challengeLoaders';
import { loadMyChallenges } from '../../../services/cache/loaders';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
  return { router, useRouter: () => router };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../../services/cache/challengeLoaders', () => ({ loadAllChallenges: jest.fn() }));
jest.mock('../../../services/cache/loaders', () => ({ loadMyChallenges: jest.fn() }));
jest.mock('../../../services/user/user.service', () => ({ searchUsers: jest.fn().mockResolvedValue([]) }));
// A card's glow is drawn once it has been measured; there is nothing to check in it here.
jest.mock('../../../components/ui/accentGlow', () => ({ AccentGlow: () => null }));

const challenge = (id: number, name: string, dominant: string, members: number) => ({
  id,
  name,
  duration_days: 30,
  dominant_activity_category: dominant,
  members_joined: members,
});

describe('Search — before typing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loadMyChallenges as jest.Mock).mockResolvedValue([]);
    (loadAllChallenges as jest.Mock).mockResolvedValue([
      challenge(1, 'Iron Will', 'strength', 50),
      challenge(2, 'Sunrise Run', 'cardioLow', 40),
      challenge(3, 'Deadlift Club', 'strength', 30),
      challenge(4, 'Stretch Daily', 'flexibility', 20),
    ]);
  });

  it('suggests the activities there are challenges for, and opens Browse filtered to one', async () => {
    const screen = await renderWithProviders(<Search />);
    await waitFor(() => expect(screen.getByTestId('search-browse-activities')).toBeTruthy());

    expect(screen.getByTestId('activity-filter-strength')).toBeTruthy();
    expect(screen.getByTestId('activity-filter-flexibility')).toBeTruthy();
    expect(screen.queryByTestId('activity-filter-mindBody')).toBeNull();
    // Chips here only navigate — no "All".
    expect(screen.queryByTestId('activity-filter-all')).toBeNull();

    await fireEvent.press(screen.getByTestId('activity-filter-cardioLow'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/challenges?view=explore&activity=cardioLow');
  });

  it('shows the 3 most joined challenges, with "See all" opening Browse', async () => {
    const screen = await renderWithProviders(<Search />);
    await waitFor(() => expect(screen.getByTestId('search-popular')).toBeTruthy());

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.getByText('Sunrise Run')).toBeTruthy();
    expect(screen.getByText('Deadlift Club')).toBeTruthy();
    expect(screen.queryByText('Stretch Daily')).toBeNull();

    await fireEvent.press(screen.getByTestId('search-popular-see-all'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/challenges?view=explore');
  });

  it('falls back to the quiet prompt when there is nothing to suggest', async () => {
    (loadAllChallenges as jest.Mock).mockResolvedValue([]);
    const screen = await renderWithProviders(<Search />);

    await waitFor(() => expect(loadAllChallenges).toHaveBeenCalled());
    expect(screen.queryByTestId('search-popular')).toBeNull();
    expect(screen.queryByTestId('search-browse-activities')).toBeNull();
  });
});
