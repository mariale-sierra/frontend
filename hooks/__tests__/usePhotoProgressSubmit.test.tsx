import { act, renderHook } from '@testing-library/react-native';
import { usePhotoProgressSubmit } from '../usePhotoProgressSubmit';
import { uploadImageAsync } from '../../services/uploads/upload.service';
import { submitWorkoutProgress } from '../../services/workout-log/workout-log.service';
import { applyExerciseMetrics } from '../../services/metrics/applyExerciseMetrics';
import { showProgressLoggedFeedback } from '../../utils/progressLoggedFeedback';
import { safeBackTimes } from '../../utils/navigation';
import { useMetricsEntryStore } from '../../store/metricsEntryStore';
import { useWorkoutAdaptationStore } from '../../store/workoutAdaptationStore';

// Sprint 10, B10: the camera's upload → save → close flow, extracted from
// app/(add)/camera.tsx into a hook. These pin what it did there, plus the B2
// addition: the photo's review state comes from the server's answer.
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock('../../services/uploads/upload.service', () => ({ uploadImageAsync: jest.fn() }));
jest.mock('../../services/workout-log/workout-log.service', () => ({ submitWorkoutProgress: jest.fn() }));
jest.mock('../../services/metrics/applyExerciseMetrics', () => ({ applyExerciseMetrics: jest.fn() }));
jest.mock('../useChallengeProgress', () => ({ invalidateChallengeProgressCache: jest.fn() }));
jest.mock('../../utils/progressLoggedFeedback', () => ({ showProgressLoggedFeedback: jest.fn() }));
jest.mock('../../utils/navigation', () => ({ safeBackTimes: jest.fn() }));

const upload = uploadImageAsync as jest.Mock;
const submit = submitWorkoutProgress as jest.Mock;
const applyMetrics = applyExerciseMetrics as jest.Mock;
const feedback = showProgressLoggedFeedback as jest.Mock;

const input = { challengeId: 'ch-1', imageUri: 'file:///photo.jpg', visibility: 'followers' as const, caption: '  hi #run ' };

async function setup() {
  const { result } = await renderHook(() => usePhotoProgressSubmit());
  return result;
}

describe('usePhotoProgressSubmit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    useMetricsEntryStore.setState({ selectedChallengeId: 'ch-1', currentRoutineId: 7, exerciseMetrics: [] });
    useWorkoutAdaptationStore.setState({ byChallenge: {} });
    upload.mockResolvedValue('https://cdn.example.com/u/photo.jpg');
    submit.mockResolvedValue({ id: 1, posts: [{ id: 'p1', moderationStatus: 'pending', visibility: 'followers' }] });
  });

  afterEach(() => jest.restoreAllMocks());

  it('uploads, saves the progress with the uploaded URL, closes the modal and passes the real photo state', async () => {
    const result = await setup();

    let failure: string | null = 'unset';
    await act(async () => {
      failure = await result.current.submit(input);
    });

    expect(failure).toBeNull();
    expect(upload).toHaveBeenCalledWith('file:///photo.jpg', 'image/jpeg');
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId: 'ch-1',
        imageUrl: 'https://cdn.example.com/u/photo.jpg',
        isRestDay: false,
        visibility: 'followers',
        caption: 'hi #run',
        routineId: 7,
        taggedUserIds: undefined,
      }),
    );
    expect(safeBackTimes).toHaveBeenCalledWith(2);
    expect(feedback).toHaveBeenCalledWith('ch-1', { photo: { status: 'pending', isPrivate: false } });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('sends the location choice only when it was made for the routine being logged (B7)', async () => {
    useWorkoutAdaptationStore.setState({
      byChallenge: {
        'ch-1': {
          routineId: 7,
          locationCode: 'home',
          locationName: 'Home',
          substitutions: [{ originalExerciseId: 1, originalName: 'Squat', substituteExerciseId: 2, substituteName: 'Lunge' }],
        },
      },
    });
    const result = await setup();

    await act(async () => {
      await result.current.submit(input);
    });

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ locationCode: 'home', substitutions: [{ originalExerciseId: 1, substituteExerciseId: 2 }] }),
    );
    // The choice is spent once the day is saved.
    expect(useWorkoutAdaptationStore.getState().byChallenge['ch-1']).toBeUndefined();
  });

  it('does not send an empty tag list', async () => {
    const result = await setup();

    await act(async () => {
      await result.current.submit({ ...input, taggedUserIds: [] });
    });

    expect(submit.mock.calls[0][0].taggedUserIds).toBeUndefined();
  });

  it('returns the upload error and never saves when the upload fails', async () => {
    upload.mockRejectedValue(new Error('network'));
    const result = await setup();

    let failure: string | null = null;
    await act(async () => {
      failure = await result.current.submit(input);
    });

    expect(failure).toBe('camera.uploadError');
    expect(submit).not.toHaveBeenCalled();
    expect(feedback).not.toHaveBeenCalled();
  });

  it('returns the save error, keeps the modal open and allows a retry when saving fails', async () => {
    submit.mockRejectedValueOnce(new Error('500'));
    const result = await setup();

    let failure: string | null = null;
    await act(async () => {
      failure = await result.current.submit(input);
    });
    expect(failure).toBe('camera.saveProgressError');
    expect(safeBackTimes).not.toHaveBeenCalled();

    await act(async () => {
      failure = await result.current.submit(input);
    });
    expect(failure).toBeNull();
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('never reports a failed metrics save as a failed day (the day is already saved)', async () => {
    useMetricsEntryStore.setState({ exerciseMetrics: [{ exerciseId: '1' } as never] });
    applyMetrics.mockRejectedValue(new Error('metrics down'));
    const result = await setup();

    let failure: string | null = 'unset';
    await act(async () => {
      failure = await result.current.submit(input);
    });

    expect(failure).toBeNull();
    expect(feedback).toHaveBeenCalled();
  });

  it('ignores a second submit while the first is still running (B5 double tap)', async () => {
    let finishUpload: (url: string) => void = () => undefined;
    upload.mockReturnValue(new Promise<string>((resolve) => (finishUpload = resolve)));
    const result = await setup();

    let second: string | null = 'unset';
    await act(async () => {
      const first = result.current.submit(input);
      second = await result.current.submit(input);
      finishUpload('https://cdn.example.com/u/photo.jpg');
      await first;
    });

    expect(second).toBeNull();
    expect(upload).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('passes no photo state when the API answer has none (older API), never assuming "published"', async () => {
    submit.mockResolvedValue({ id: 1 });
    const result = await setup();

    await act(async () => {
      await result.current.submit(input);
    });

    expect(feedback).toHaveBeenCalledWith('ch-1', { photo: null });
  });
});
