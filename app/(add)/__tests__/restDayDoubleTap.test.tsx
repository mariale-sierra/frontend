import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import RestDay from '../rest-day';
import { getChallengeProgress } from '../../../services/challenge/challenge.service';
import { submitWorkoutProgress } from '../../../services/workout-log/workout-log.service';
import { useMetricsEntryStore } from '../../../store/metricsEntryStore';
import { showProgressLoggedFeedback } from '../../../utils/progressLoggedFeedback';

// B5 — Concurrency and integrity of Workout Progress: same double-tap guard
// as camera.tsx's confirm button, applied to rest-day.tsx's "Just today"
// button — see cameraDoubleTap.test.tsx for the full rationale.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock('../../../services/challenge/challenge.service', () => ({
  getChallengeProgress: jest.fn(),
}));
jest.mock('../../../services/workout-log/workout-log.service', () => ({ submitWorkoutProgress: jest.fn() }));
jest.mock('../../../hooks/useChallengeProgress', () => ({ invalidateChallengeProgressCache: jest.fn() }));
jest.mock('../../../utils/progressLoggedFeedback', () => ({ showProgressLoggedFeedback: jest.fn() }));

async function openRestDay() {
  useMetricsEntryStore.setState({ selectedChallengeId: 'ch-1', exerciseMetrics: [], currentRoutineId: null });
  (getChallengeProgress as jest.Mock).mockResolvedValue({ completedToday: false });
  (submitWorkoutProgress as jest.Mock).mockResolvedValue({ id: 1 });

  const screen = await renderWithTheme(<RestDay />);
  await waitFor(() => expect(screen.getByText('restDay.justTodayButton')).toBeTruthy());
  return screen;
}

describe('the rest-day "Just today" button — B5 double-tap guard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('submits only once when tapped twice back-to-back, before the button has a chance to disable', async () => {
    const screen = await openRestDay();
    const justTodayButton = screen.getByText('restDay.justTodayButton');

    // Same reasoning as cameraDoubleTap.test.tsx: both presses inside one
    // act() batch, no await in between, reproducing the pre-re-render race
    // without tripping React's "overlapping act() calls" guard.
    await act(async () => {
      fireEvent.press(justTodayButton);
      fireEvent.press(justTodayButton);
    });

    await waitFor(() => expect(showProgressLoggedFeedback).toHaveBeenCalled());
    expect(submitWorkoutProgress).toHaveBeenCalledTimes(1);
  });

  it('a normal single tap still submits normally', async () => {
    const screen = await openRestDay();

    await fireEvent.press(screen.getByText('restDay.justTodayButton'));

    await waitFor(() => expect(submitWorkoutProgress).toHaveBeenCalledTimes(1));
  });

  it('allows a retry after a failed submission (the guard is not left stuck)', async () => {
    (submitWorkoutProgress as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'boom' } },
    });
    const screen = await openRestDay();
    const justTodayButton = screen.getByText('restDay.justTodayButton');

    await fireEvent.press(justTodayButton);
    await waitFor(() => expect(submitWorkoutProgress).toHaveBeenCalledTimes(1));

    (submitWorkoutProgress as jest.Mock).mockResolvedValueOnce({ id: 2 });
    await fireEvent.press(justTodayButton);

    await waitFor(() => expect(submitWorkoutProgress).toHaveBeenCalledTimes(2));
  });
});
