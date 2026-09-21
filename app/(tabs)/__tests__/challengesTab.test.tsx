import { act, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import Challenges from '../challenges';
import { getMyChallenges } from '../../../services/user/user.service';
import { getChallenges, getMyProgressPhotos } from '../../../services/challenge/challenge.service';
import { hasShownCompletion, markCompletionShown } from '../../../utils/shownCompletions';
import { useChallengeFinishedStore } from '../../../store/challengeFinishedStore';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    // Runs the screen's focus effect when it mounts, as focusing it would.
    useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
    useIsFocused: () => true,
    useLocalSearchParams: () => ({}),
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../../services/user/user.service', () => ({ getMyChallenges: jest.fn() }));
jest.mock('../../../services/challenge/challenge.service', () => ({
  getChallenges: jest.fn(),
  getMyProgressPhotos: jest.fn(),
}));
jest.mock('../../../utils/shownCompletions', () => ({
  hasShownCompletion: jest.fn(),
  markCompletionShown: jest.fn(),
}));
// A card's glow is drawn once it has been measured; there is nothing to check in it here.
jest.mock('../../../components/ui/accentGlow', () => ({ AccentGlow: () => null }));

const challenge = (id: number, name: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name,
  status: 'active',
  current_day: 5,
  duration_days: 30,
  today_is_rest_day: false,
  today_completed: false,
  dominant_activity_category: 'strength',
  ...overrides,
});

const FINISHED = challenge(2, 'Finished Marathon', { status: 'completed', current_day: 30 });
const GOING = challenge(1, 'Morning Run');

describe('the Challenges tab — a finished challenge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useChallengeFinishedStore.setState({ visible: false, challenge: null });
    (getChallenges as jest.Mock).mockResolvedValue([]);
    (getMyProgressPhotos as jest.Mock).mockResolvedValue([]);
    (hasShownCompletion as jest.Mock).mockResolvedValue(true);
    (markCompletionShown as jest.Mock).mockResolvedValue(undefined);
  });

  async function renderTab(mine: unknown[]) {
    (getMyChallenges as jest.Mock).mockResolvedValue(mine);
    const screen = await renderWithProviders(<Challenges />);
    await waitFor(() => expect(screen.getByText(GOING.name)).toBeTruthy());
    return screen;
  }

  it('stays in Mine, next to the challenges still going', async () => {
    const screen = await renderTab([GOING, FINISHED]);

    expect(screen.getByText('Finished Marathon')).toBeTruthy();
    expect(screen.getByText('Morning Run')).toBeTruthy();
  });

  it('is listed after the ones still going', async () => {
    const screen = await renderTab([FINISHED, GOING]);

    // In the order the cards are drawn, top to bottom.
    const titles = screen.getAllByText(/Morning Run|Finished Marathon/).map((node) => node.props.children);
    expect(titles).toEqual(['Morning Run', 'Finished Marathon']);
  });

  it('is still there when its celebration is closed — it must not vanish with the popup', async () => {
    (hasShownCompletion as jest.Mock).mockResolvedValue(false);
    const screen = await renderTab([GOING, FINISHED]);

    // The tab shows the "Challenge complete" popup once for a challenge that finished...
    await waitFor(() => expect(useChallengeFinishedStore.getState().visible).toBe(true));
    expect(useChallengeFinishedStore.getState().challenge).toMatchObject({ challengeName: 'Finished Marathon' });

    // ...and closing it leaves the card where it was.
    await act(async () => useChallengeFinishedStore.getState().hide());

    expect(screen.getByText('Finished Marathon')).toBeTruthy();
  });

  it('is celebrated once and no more, and still listed after that', async () => {
    (hasShownCompletion as jest.Mock).mockResolvedValue(true);
    const screen = await renderTab([GOING, FINISHED]);

    expect(useChallengeFinishedStore.getState().visible).toBe(false);
    expect(markCompletionShown).not.toHaveBeenCalled();
    expect(screen.getByText('Finished Marathon')).toBeTruthy();
  });

  it('is the only card there when it is the only challenge, not an empty Mine', async () => {
    (getMyChallenges as jest.Mock).mockResolvedValue([FINISHED]);
    const screen = await renderWithProviders(<Challenges />);

    await waitFor(() => expect(screen.getByText('Finished Marathon')).toBeTruthy());
  });
});
