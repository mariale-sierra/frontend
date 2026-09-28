import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import Camera from '../camera';
import { getChallenge, getChallengeUsers } from '../../../services/challenge/challenge.service';
import { submitWorkoutProgress } from '../../../services/workout-log/workout-log.service';
import { uploadImageAsync } from '../../../services/uploads/upload.service';
import { useMetricsEntryStore } from '../../../store/metricsEntryStore';
import { showProgressLoggedFeedback } from '../../../utils/progressLoggedFeedback';

// B5 — Concurrency and integrity of Workout Progress: a double tap on the
// confirm button, fired before React commits the re-render that disables it
// (isBusy), must still only ever emit one submitWorkoutProgress call. The
// database's uq_workout_logs_user_challenge_local_day constraint is the real
// guarantee against a duplicate; this is the UX-side defense on top of it.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return { router, useRouter: () => router, useFocusEffect: () => undefined, useIsFocused: () => true };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({
    t: (key: string, values?: { count?: number }) => (values?.count !== undefined ? `${key}:${values.count}` : key),
  }),
}));
jest.mock('expo-camera', () => {
  const { forwardRef, useImperativeHandle } = require('react');
  return {
    CameraView: forwardRef((_props: unknown, ref: unknown) => {
      useImperativeHandle(ref, () => ({ takePictureAsync: jest.fn().mockResolvedValue({ uri: 'file:///photo.jpg' }) }));
      return null;
    }),
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ userId: 'owner-1' }) }));
jest.mock('../../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock('../../../services/challenge/challenge.service', () => ({
  ...jest.requireActual('../../../services/challenge/challenge.service'),
  getChallenge: jest.fn(),
  getChallengeUsers: jest.fn(),
}));
jest.mock('../../../services/workout-log/workout-log.service', () => ({ submitWorkoutProgress: jest.fn() }));
jest.mock('../../../services/uploads/upload.service', () => ({ uploadImageAsync: jest.fn() }));
jest.mock('../../../services/metrics/applyExerciseMetrics', () => ({ applyExerciseMetrics: jest.fn() }));
jest.mock('../../../hooks/useChallengeProgress', () => ({ invalidateChallengeProgressCache: jest.fn() }));
jest.mock('../../../utils/progressLoggedFeedback', () => ({ showProgressLoggedFeedback: jest.fn() }));

async function takePhoto() {
  useMetricsEntryStore.setState({ selectedChallengeId: 'ch-1', exerciseMetrics: [], currentRoutineId: null });
  (getChallenge as jest.Mock).mockResolvedValue({ id: 'ch-1', name: 'Morning Run', created_by_user_id: 'someone-else' });
  (getChallengeUsers as jest.Mock).mockResolvedValue([]);
  (uploadImageAsync as jest.Mock).mockResolvedValue('https://example.com/photo.jpg');
  (submitWorkoutProgress as jest.Mock).mockResolvedValue({ id: 1 });

  const screen = await renderWithTheme(<Camera />);
  await fireEvent.press(screen.getByTestId('camera-capture'));
  await waitFor(() => expect(screen.getByText('camera.visibilityFollowers')).toBeTruthy());
  return screen;
}

describe('the camera confirm button — B5 double-tap guard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('submits only once when tapped twice back-to-back, before the button has a chance to disable', async () => {
    const screen = await takePhoto();
    const confirmButton = screen.getByTestId('camera-confirm');

    // Both presses fired inside one act() batch, with no await in between —
    // the exact "before React commits the isBusy re-render" window a real
    // fast double tap can land in. Sequential `await fireEvent.press()`
    // calls would not reproduce this: each would let the first submission's
    // state update (and confirmingRef write) land before the second tap
    // starts — separate, un-awaited fireEvent.press() calls instead trip
    // React's "overlapping act() calls" guard, since each opens its own
    // scope around an async handler. The confirmingRef write itself is a
    // plain synchronous assignment, not a React state update, so it's
    // already in effect for the second press regardless of batching.
    await act(async () => {
      fireEvent.press(confirmButton);
      fireEvent.press(confirmButton);
    });

    // Waits for the whole success chain (not just the submit call itself)
    // to settle before the test ends, so no state update from it lands
    // after this test's cleanup — on an unmounted component here, or
    // bleeding into the next test otherwise.
    await waitFor(() => expect(showProgressLoggedFeedback).toHaveBeenCalled());
    expect(submitWorkoutProgress).toHaveBeenCalledTimes(1);
  });

  it('a normal single tap still submits normally', async () => {
    const screen = await takePhoto();

    await fireEvent.press(screen.getByTestId('camera-confirm'));

    await waitFor(() => expect(submitWorkoutProgress).toHaveBeenCalledTimes(1));
  });

  it('allows a retry after a failed submission (the guard is not left stuck)', async () => {
    (submitWorkoutProgress as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'boom' } },
    });
    const screen = await takePhoto();
    const confirmButton = screen.getByTestId('camera-confirm');

    await fireEvent.press(confirmButton);
    await waitFor(() => expect(submitWorkoutProgress).toHaveBeenCalledTimes(1));

    (submitWorkoutProgress as jest.Mock).mockResolvedValueOnce({ id: 2 });
    await fireEvent.press(confirmButton);

    await waitFor(() => expect(submitWorkoutProgress).toHaveBeenCalledTimes(2));
  });
});
