import { ActivityIndicator } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders, screen } from '../../../test-utils/renderWithProviders';
import Home from '../index';
import { getMyChallenges } from '../../../services/user/user.service';
import { getHomeFeed } from '../../../services/feed/feed.service';
import type { ChallengeContract } from '../../../types/challenge';

// Home reads the username from useAuth() (context/authContext.tsx). The real
// AuthProvider does async storage/network calls on mount, which is more than
// this screen-level test needs — mock the hook directly instead.
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ username: 'testuser' }),
}));

// Avoid needing a real SafeAreaProvider ancestor just to satisfy this hook.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Home fetches its data from these two services on mount (GET /users/me/challenges
// and GET /feed) — mock both so the test controls exactly what "the backend"
// returns instead of making real network calls.
jest.mock('../../../services/user/user.service', () => ({
  getMyChallenges: jest.fn(),
}));
jest.mock('../../../services/feed/feed.service', () => ({
  getHomeFeed: jest.fn(),
}));

const mockedGetMyChallenges = getMyChallenges as jest.Mock;
const mockedGetHomeFeed = getHomeFeed as jest.Mock;

describe('Home screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetHomeFeed.mockResolvedValue([]);
  });

  it('renders the current username', () => {
    mockedGetMyChallenges.mockResolvedValue([]);

    renderWithProviders(<Home />);

    expect(screen.getByText('testuser')).toBeTruthy();
  });

  it('renders ActiveChallengeSection with the challenges returned by the challenges service', async () => {
    const challenge: ChallengeContract = {
      id: 'challenge-1',
      name: 'Iron Will',
      duration_days: 75,
      current_day: 14,
      status: 'active',
    } as ChallengeContract;
    mockedGetMyChallenges.mockResolvedValue([challenge]);

    renderWithProviders(<Home />);

    // Confirms ActiveChallengeSection actually rendered (not just that data loaded).
    expect(await screen.findByText('Iron Will')).toBeTruthy();
  });

  it('hides the loading indicator once the challenges have finished loading', async () => {
    let resolveChallenges!: (value: ChallengeContract[]) => void;
    const pendingChallenges = new Promise<ChallengeContract[]>((resolve) => {
      resolveChallenges = resolve;
    });
    mockedGetMyChallenges.mockReturnValue(pendingChallenges);

    renderWithProviders(<Home />);

    // While the challenges request is still pending, the loader is on screen.
    expect(screen.UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);

    resolveChallenges([]);

    await waitFor(() => {
      expect(screen.UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0);
    });
  });
});
