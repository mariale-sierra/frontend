import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMetricsScreen } from '../useMetricsScreen';
import { useAuth } from '../useAuth';
import { loadMyChallenges } from '../../services/cache/loaders';
import { loadTodayRoutine } from '../../services/challenge/todayRoutineAdapted';
import { getRoutine } from '../../services/routine/routine.service';
import { safeBack } from '../../utils/navigation';
import { useMetricsEntryStore } from '../../store/metricsEntryStore';
import { useWorkoutAdaptationStore } from '../../store/workoutAdaptationStore';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import type { ChallengeContract, TodayRoutineContract } from '../../types/challenge';
import type { WorkoutAdaptation } from '../../store/workoutAdaptationStore';

// Sprint 10, B10: the Log-Metrics screen's data hook. Services are mocked at
// their boundary; the adapters and stores are the real ones.
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('../useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../../services/cache/loaders', () => ({ loadMyChallenges: jest.fn() }));
jest.mock('../../services/challenge/todayRoutineAdapted', () => ({ loadTodayRoutine: jest.fn() }));
jest.mock('../../services/routine/routine.service', () => ({ getRoutine: jest.fn() }));
jest.mock('../../utils/navigation', () => ({ safeBack: jest.fn() }));

const myChallenges = loadMyChallenges as jest.Mock;
const todayRoutine = loadTodayRoutine as jest.Mock;
const routineById = getRoutine as jest.Mock;
const searchParams = useLocalSearchParams as jest.Mock;

function challenge(id: number, name: string, status = 'active'): ChallengeContract {
  return { id, name, status, categories: ['strength'], locations: ['gym'] };
}

/** `routineId` 0 stands for "no routine id" (the hook skips the name lookup). */
function routine(routineId: number, exerciseName: string, day = 3): TodayRoutineContract {
  return {
    routine_id: routineId,
    currentDayInCycle: day,
    exercises: [{ id: 11, exercise: { id: 101, name: exerciseName }, sets: [] }],
  };
}

function loaded(routineContract: TodayRoutineContract, invalidAdaptation = false) {
  return { routine: routineContract, invalidAdaptation, base: routineContract };
}

/** An axios-like failure the global interceptor already toasted. */
function apiError(status: number) {
  return Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });
}

async function setup() {
  const { result } = await renderHook(() => useMetricsScreen());
  return result;
}

describe('useMetricsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (useAuth as jest.Mock).mockReturnValue({ userId: 'user-1' });
    searchParams.mockReturnValue({});
    useMetricsEntryStore.setState({ challenges: [], selectedChallengeId: '', exerciseMetrics: [], currentRoutineId: null });
    useWorkoutAdaptationStore.setState({ byChallenge: {} });
    useErrorNotificationStore.setState({ visible: false, config: { message: '' } });
    routineById.mockResolvedValue({ name: 'Upper body' });
  });

  afterEach(() => jest.restoreAllMocks());

  it('loads only active challenges, selects the first one and shows its routine for today', async () => {
    myChallenges.mockResolvedValue([challenge(1, 'Strength'), challenge(2, 'Done', 'completed'), challenge(3, 'Run')]);
    todayRoutine.mockResolvedValue(loaded(routine(7, 'Squat')));

    const result = await setup();

    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    await waitFor(() => expect(result.current.routineName).toBe('Upper body'));
    expect(result.current.challenges.map((c) => c.id)).toEqual(['1', '3']);
    expect(result.current.selectedChallengeId).toBe('1');
    expect(todayRoutine).toHaveBeenCalledTimes(1);
    expect(todayRoutine).toHaveBeenCalledWith('1');
    expect(result.current.exerciseMetrics.map((e) => e.name)).toEqual(['Squat']);
    expect(result.current.routineId).toBe(7);
    expect(result.current.currentDay).toBe(3);
    expect(result.current.baseExercises).toEqual([{ exerciseId: 101, name: 'Squat' }]);
    expect(result.current.challengeLoadError).toBeNull();
    expect(routineById).toHaveBeenCalledWith(7);
  });

  it('preselects the challenge picked in the "log today" chooser', async () => {
    searchParams.mockReturnValue({ challengeId: '3' });
    myChallenges.mockResolvedValue([challenge(1, 'Strength'), challenge(3, 'Run')]);
    todayRoutine.mockResolvedValue(loaded(routine(9, 'Sprint')));

    const result = await setup();

    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    expect(result.current.selectedChallengeId).toBe('3');
    expect(todayRoutine).toHaveBeenCalledWith('3');
  });

  it('falls back to the first challenge when the requested one is not active', async () => {
    searchParams.mockReturnValue({ challengeId: '99' });
    myChallenges.mockResolvedValue([challenge(1, 'Strength')]);
    todayRoutine.mockResolvedValue(loaded(routine(7, 'Squat')));

    const result = await setup();

    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    expect(result.current.selectedChallengeId).toBe('1');
  });

  it('shows the empty state without asking for a routine when no challenge is active', async () => {
    myChallenges.mockResolvedValue([challenge(2, 'Done', 'completed')]);

    const result = await setup();

    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    expect(result.current.challenges).toEqual([]);
    expect(result.current.exerciseMetrics).toEqual([]);
    expect(result.current.challengeLoadError).toBeNull();
    expect(todayRoutine).not.toHaveBeenCalled();
  });

  it('loads nothing while there is no signed-in user', async () => {
    (useAuth as jest.Mock).mockReturnValue({ userId: null });

    const result = await setup();

    expect(myChallenges).not.toHaveBeenCalled();
    expect(result.current.isLoadingData).toBe(true);
  });

  it('reports an expired session (401) apart from other failures', async () => {
    myChallenges.mockRejectedValue(apiError(401));

    const result = await setup();

    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    expect(result.current.challengeLoadError).toBe('401');
  });

  it.each([
    ['a server error', apiError(500)],
    ['a network failure', new Error('Network Error')],
    ['a non-Error rejection', 'boom'],
  ])('reports a generic load error for %s', async (_label, failure) => {
    myChallenges.mockRejectedValue(failure);

    const result = await setup();

    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    expect(result.current.challengeLoadError).toBe('generic');
  });

  it('keeps the challenge list when only the first routine fails to load', async () => {
    myChallenges.mockResolvedValue([challenge(1, 'Strength')]);
    todayRoutine.mockRejectedValue(apiError(500));

    const result = await setup();

    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    expect(result.current.challenges.map((c) => c.id)).toEqual(['1']);
    expect(result.current.exerciseMetrics).toEqual([]);
    expect(result.current.challengeLoadError).toBeNull();
  });

  it('leaves the routine name empty when the routine itself cannot be read', async () => {
    myChallenges.mockResolvedValue([challenge(1, 'Strength')]);
    todayRoutine.mockResolvedValue(loaded(routine(7, 'Squat')));
    routineById.mockRejectedValue(apiError(404));

    const result = await setup();

    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    await waitFor(() => expect(routineById).toHaveBeenCalled());
    expect(result.current.routineName).toBeNull();
    expect(result.current.currentDay).toBe(3);
  });

  it('flags a location choice the backend no longer accepts, and skips the name of a routine without id', async () => {
    myChallenges.mockResolvedValue([challenge(1, 'Strength')]);
    todayRoutine.mockResolvedValue(loaded(routine(0, 'Squat'), true));

    const result = await setup();

    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    expect(result.current.adaptationInvalid).toBe(true);
    expect(routineById).not.toHaveBeenCalled();
    expect(result.current.routineName).toBeNull();
  });

  describe('switching challenge', () => {
    async function loadedWithTwo() {
      myChallenges.mockResolvedValue([challenge(1, 'Strength'), challenge(3, 'Run')]);
      todayRoutine.mockResolvedValueOnce(loaded(routine(7, 'Squat')));
      const result = await setup();
      await waitFor(() => expect(result.current.isLoadingData).toBe(false));
      return result;
    }

    it("loads the newly picked challenge's routine", async () => {
      const result = await loadedWithTwo();
      todayRoutine.mockResolvedValueOnce(loaded(routine(9, 'Sprint', 5)));

      await act(async () => {
        useMetricsEntryStore.setState({ selectedChallengeId: '3' });
      });

      await waitFor(() => expect(result.current.exerciseMetrics.map((e) => e.name)).toEqual(['Sprint']));
      expect(todayRoutine).toHaveBeenLastCalledWith('3');
      expect(result.current.routineId).toBe(9);
      expect(result.current.currentDay).toBe(5);
      expect(result.current.isLoadingData).toBe(false);
    });

    it('tells the user when the routine fails for a reason no toast covered', async () => {
      const result = await loadedWithTwo();
      todayRoutine.mockRejectedValueOnce(new TypeError('unexpected routine shape'));

      await act(async () => {
        useMetricsEntryStore.setState({ selectedChallengeId: '3' });
      });

      await waitFor(() => expect(result.current.isLoadingData).toBe(false));
      const toast = useErrorNotificationStore.getState();
      expect(toast.visible).toBe(true);
      expect(toast.config.message).toBe('metrics.alerts.routineLoadError');
    });

    it('does not stack a second message on an API failure the interceptor already toasted', async () => {
      const result = await loadedWithTwo();
      todayRoutine.mockRejectedValueOnce(apiError(500));

      await act(async () => {
        useMetricsEntryStore.setState({ selectedChallengeId: '3' });
      });

      await waitFor(() => expect(result.current.isLoadingData).toBe(false));
      expect(useErrorNotificationStore.getState().visible).toBe(false);
    });
  });

  it('re-reads the routine after the user picks a location, and after dropping it', async () => {
    myChallenges.mockResolvedValue([challenge(1, 'Strength')]);
    todayRoutine.mockResolvedValue(loaded(routine(7, 'Squat')));
    const result = await setup();
    await waitFor(() => expect(result.current.isLoadingData).toBe(false));
    const adaptation: WorkoutAdaptation = { routineId: 7, locationCode: 'home', locationName: 'Home', substitutions: [] };

    await act(async () => {
      result.current.applyLocation(adaptation);
    });

    await waitFor(() => expect(todayRoutine).toHaveBeenCalledTimes(2));
    expect(useWorkoutAdaptationStore.getState().byChallenge['1']).toEqual(adaptation);

    await act(async () => {
      result.current.resetLocation();
    });

    await waitFor(() => expect(todayRoutine).toHaveBeenCalledTimes(3));
    expect(useWorkoutAdaptationStore.getState().byChallenge['1']).toBeUndefined();
  });

  it('navigates to the camera, the rest day and back', async () => {
    myChallenges.mockResolvedValue([]);
    const result = await setup();

    result.current.goToCamera();
    result.current.goToRestDay();
    result.current.goBack();

    expect(router.push).toHaveBeenNthCalledWith(1, '/(add)/camera');
    expect(router.push).toHaveBeenNthCalledWith(2, '/(add)/rest-day');
    expect(safeBack).toHaveBeenCalledTimes(1);
  });
});
