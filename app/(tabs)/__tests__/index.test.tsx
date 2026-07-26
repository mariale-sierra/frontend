import { renderWithProviders } from '../../../test-utils/renderWithProviders';
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

  it('renders the current username', async () => {
    mockedGetMyChallenges.mockResolvedValue([]);

    const screen = await renderWithProviders(<Home />);

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

    const screen = await renderWithProviders(<Home />);

    // Confirms ActiveChallengeSection actually rendered (not just that data loaded).
    expect(await screen.findByText('Iron Will')).toBeTruthy();
  });

  it('shows the loaded challenge area (loader replaced) once the challenges have finished loading', async () => {
    let resolveChallenges!: (value: ChallengeContract[]) => void;
    const pendingChallenges = new Promise<ChallengeContract[]>((resolve) => {
      resolveChallenges = resolve;
    });
    mockedGetMyChallenges.mockReturnValue(pendingChallenges);

    const screen = await renderWithProviders(<Home />);

    // While the challenges request is still pending the loader is shown, so the
    // loaded empty-state copy is not on screen yet.
    expect(screen.queryByText('No active challenge')).toBeNull();

    resolveChallenges([]);

    // Once loading finishes with no challenges, the loader is replaced by the
    // empty-state content.
    expect(await screen.findByText('No active challenge')).toBeTruthy();
  });
});
