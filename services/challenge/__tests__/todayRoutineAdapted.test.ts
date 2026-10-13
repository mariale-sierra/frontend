import { loadTodayRoutine } from '../todayRoutineAdapted';
import { getTodayRoutineForChallenge } from '../challenge.service';
import { useWorkoutAdaptationStore } from '../../../store/workoutAdaptationStore';

jest.mock('../challenge.service', () => ({ getTodayRoutineForChallenge: jest.fn() }));
const getToday = getTodayRoutineForChallenge as jest.Mock;

const base = { routine_id: 9, exercises: [{ id: 1, exercise: { id: 10, name: 'Barbell Squat' } }] };
const adapted = { routine_id: 9, locationCode: 'home', exercises: [{ id: 1, exercise: { id: 12, name: 'Air Squat' } }] };
const adaptation = {
  routineId: 9,
  locationCode: 'home',
  locationName: 'Home',
  substitutions: [
    { originalExerciseId: 10, originalName: 'Barbell Squat', substituteExerciseId: 12, substituteName: 'Air Squat' },
  ],
};

describe('loadTodayRoutine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWorkoutAdaptationStore.setState({ byChallenge: {} });
  });

  it('returns the routine as written when the user has not changed location', async () => {
    getToday.mockResolvedValue(base);
    const result = await loadTodayRoutine('c1');
    expect(result).toEqual({ routine: base, invalidAdaptation: false, base });
    expect(getToday).toHaveBeenCalledTimes(1);
  });

  it("asks for the user's own view when they adapted this routine", async () => {
    useWorkoutAdaptationStore.getState().setAdaptation('c1', adaptation);
    getToday.mockResolvedValueOnce(base).mockResolvedValueOnce(adapted);

    const result = await loadTodayRoutine('c1');

    expect(getToday).toHaveBeenLastCalledWith('c1', { locationCode: 'home', substitutions: '10:12' });
    expect(result.routine).toBe(adapted);
    expect(result.invalidAdaptation).toBe(false);
  });

  it("ignores an adaptation made for another day's routine (and keeps it)", async () => {
    useWorkoutAdaptationStore.getState().setAdaptation('c1', { ...adaptation, routineId: 77 });
    getToday.mockResolvedValue(base);

    const result = await loadTodayRoutine('c1');

    expect(getToday).toHaveBeenCalledTimes(1);
    expect(result.routine).toBe(base);
    expect(useWorkoutAdaptationStore.getState().byChallenge.c1).toBeDefined();
  });

  it('drops a rejected adaptation and falls back to the routine as written instead of failing', async () => {
    useWorkoutAdaptationStore.getState().setAdaptation('c1', adaptation);
    getToday.mockResolvedValueOnce(base).mockRejectedValueOnce(new Error('400'));

    const result = await loadTodayRoutine('c1');

    expect(result).toEqual({ routine: base, invalidAdaptation: true, base });
    expect(useWorkoutAdaptationStore.getState().byChallenge.c1).toBeUndefined();
  });
});
