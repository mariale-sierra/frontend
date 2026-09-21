import 'react-native-gesture-handler/jestSetup';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { renderWithTheme } from '../../test-utils/renderWithTheme';
import LogChallengePicker from '../log';
import { getMyChallenges } from '../../services/user/user.service';
import { getMyProgressPhotos } from '../../services/challenge/challenge.service';
import { router } from 'expo-router';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { name?: string }) => (values?.name ? `${key}:${values.name}` : key),
  }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('../../services/user/user.service', () => ({ getMyChallenges: jest.fn() }));
jest.mock('../../services/challenge/challenge.service', () => ({ getMyProgressPhotos: jest.fn() }));
// The glow is drawn once a card has been measured; this hands it a size at once.
jest.mock('../../components/ui/accentGlow', () => ({
  AccentGlow: ({ children }: { children: (size: { width: number; height: number }) => React.ReactNode }) =>
    children({ width: 300, height: 340 }),
}));

const challenge = (id: number, name: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name,
  status: 'active',
  current_day: 3,
  duration_days: 21,
  today_is_rest_day: false,
  today_completed: false,
  dominant_activity_category: 'strength',
  ...overrides,
});

async function renderPicker() {
  return renderWithTheme(<LogChallengePicker />);
}

// The screen measures the space the deck has once, and gives its width to whichever of the
// skeleton and the deck is showing.
async function giveDeckItsWidth() {
  await fireEvent(await screen.findByTestId('log-challenges'), 'layout', {
    nativeEvent: { layout: { width: 342, height: 0, x: 0, y: 0 } },
  });
}

describe('the log-progress picker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getMyProgressPhotos as jest.Mock).mockResolvedValue([]);
  });

  it('asks which challenge, over a deck of cards — one per challenge that can be logged today', async () => {
    (getMyChallenges as jest.Mock).mockResolvedValue([
      challenge(1, 'Morning Strength'),
      challenge(2, 'Evening Run'),
      challenge(3, 'Rest day challenge', { today_is_rest_day: true }),
    ]);
    await renderPicker();
    await giveDeckItsWidth();

    expect(screen.getByText('logMetrics.pickChallenge.title')).toBeTruthy();
    expect(screen.getByText('logMetrics.pickChallenge.subtitle')).toBeTruthy();
    expect(screen.getByText('Morning Strength')).toBeTruthy();
    expect(screen.getByText('Evening Run')).toBeTruthy();
    // Nothing to log on a rest day: no card for it.
    expect(screen.queryByText('Rest day challenge')).toBeNull();
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('opens the metrics screen for the challenge whose front card is pressed', async () => {
    (getMyChallenges as jest.Mock).mockResolvedValue([challenge(7, 'Morning Strength'), challenge(8, 'Evening Run')]);
    await renderPicker();
    await giveDeckItsWidth();

    // A tap on the front card, in the middle of the deck.
    fireGestureHandler(getByGestureTestId('challenge-deck-tap'), [
      { state: State.BEGAN, x: 171, y: 100 },
      { state: State.ACTIVE, x: 171, y: 100 },
      { state: State.END, x: 171, y: 100 },
    ]);

    expect(router.replace).toHaveBeenCalledWith('/(add)/metrics?challengeId=7');
  });

  it('is not a list any more: no scrolling rows, the cards are piled up', async () => {
    (getMyChallenges as jest.Mock).mockResolvedValue([challenge(1, 'Morning Strength'), challenge(2, 'Evening Run')]);
    await renderPicker();
    await giveDeckItsWidth();

    expect(JSON.stringify(screen.toJSON())).not.toContain('RCTScrollView');
  });

  it('shows the deck as a skeleton while the challenges load, not a spinner', async () => {
    // Never arrives: the picker stays loading.
    (getMyChallenges as jest.Mock).mockReturnValue(new Promise(() => undefined));
    await renderPicker();
    await giveDeckItsWidth();

    expect(screen.getByTestId('challenge-deck-skeleton')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain('ActivityIndicator');
    expect(screen.queryByTestId('challenge-deck')).toBeNull();
  });

  it('swaps the skeleton for the deck once they have', async () => {
    (getMyChallenges as jest.Mock).mockResolvedValue([challenge(1, 'Morning Strength')]);
    await renderPicker();
    await giveDeckItsWidth();

    await waitFor(() => expect(screen.queryByTestId('challenge-deck-skeleton')).toBeNull());
    expect(screen.getByTestId('challenge-deck')).toBeTruthy();
  });

  it('has the deck there in the very frame the skeleton goes — no empty moment while it measures itself', async () => {
    let arrive: (challenges: unknown[]) => void = () => undefined;
    (getMyChallenges as jest.Mock).mockReturnValue(new Promise((resolve) => (arrive = resolve)));
    await renderPicker();
    await giveDeckItsWidth();
    expect(screen.getByTestId('challenge-deck-skeleton')).toBeTruthy();

    // The challenges arrive. No further layout happens — the width was measured once, before.
    await act(async () => arrive([challenge(1, 'Morning Strength'), challenge(2, 'Evening Run')]));

    expect(screen.queryByTestId('challenge-deck-skeleton')).toBeNull();
    expect(screen.getByText('Morning Strength')).toBeTruthy();
    expect(screen.getByText('Evening Run')).toBeTruthy();
  });

  it('draws the skeleton as soon as it has a width, and the deck at that width — one measurement for both', async () => {
    (getMyChallenges as jest.Mock).mockReturnValue(new Promise(() => undefined));
    await renderPicker();

    expect(screen.queryByTestId('challenge-deck-skeleton')).toBeNull();
    await giveDeckItsWidth();
    expect(screen.getByTestId('challenge-deck-skeleton')).toBeTruthy();
  });

  it('tells you when there is nothing to log today, and offers the other challenges', async () => {
    (getMyChallenges as jest.Mock).mockResolvedValue([challenge(1, 'Morning Strength', { today_completed: true })]);
    await renderPicker();

    await waitFor(() => expect(screen.getByText('logMetrics.pickChallenge.allLoggedMessage')).toBeTruthy());
    expect(screen.getByText('logMetrics.pickChallenge.exploreCta')).toBeTruthy();
  });

  it('says so when you are in no challenge at all', async () => {
    (getMyChallenges as jest.Mock).mockResolvedValue([]);
    await renderPicker();

    await waitFor(() => expect(screen.getByText('logMetrics.pickChallenge.emptyMessage')).toBeTruthy());
  });

  it('says so when the challenges could not be loaded', async () => {
    (getMyChallenges as jest.Mock).mockRejectedValue(new Error('offline'));
    await renderPicker();

    await waitFor(() => expect(screen.getByText('logMetrics.pickChallenge.errorMessage')).toBeTruthy());
  });

  it('sends you to the Explore list from the empty state', async () => {
    (getMyChallenges as jest.Mock).mockResolvedValue([]);
    await renderPicker();

    await fireEvent.press(await screen.findByText('logMetrics.pickChallenge.exploreCta'));

    expect(router.replace).toHaveBeenCalledWith('/(tabs)/challenges?view=explore');
  });
});
