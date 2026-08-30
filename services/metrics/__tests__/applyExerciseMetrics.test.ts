import { addMetricToWorkoutLogExercise, addMetricToWorkoutLogExerciseSet } from '../metrics.service';
import { applyExerciseMetrics } from '../applyExerciseMetrics';
import type { ExerciseMetricsBlock } from '../../../types/metrics';
import type { WorkoutLogContract } from '../../../types/workout-log';

jest.mock('../metrics.service', () => ({
  addMetricToWorkoutLogExercise: jest.fn(),
  addMetricToWorkoutLogExerciseSet: jest.fn(),
}));

const mockedAddMetric = addMetricToWorkoutLogExercise as jest.Mock;
const mockedAddSetMetric = addMetricToWorkoutLogExerciseSet as jest.Mock;

function strengthBlock(overrides: Partial<ExerciseMetricsBlock> = {}): ExerciseMetricsBlock {
  return {
    id: 'block-1',
    exerciseId: 42,
    name: 'Bench Press',
    activityType: 'strength',
    location: 'gym',
    notes: '',
    rows: [{ set: 1, reps: '10', lbs: '135' }],
    ...overrides,
  };
}

function workoutWithExercise(exerciseId: number, wleId = 100): WorkoutLogContract {
  return {
    id: 1,
    exercises: [{ id: wleId, exercise: { id: exerciseId, name: 'Bench Press' } }],
  };
}

/** A workout whose exercise has real backend `workout_log_exercise_sets`
 * rows (createWorkout() copies these over when the routine exercise had
 * any) — this is what routes applyExerciseMetrics into the per-set path. */
function workoutWithSets(
  exerciseId: number,
  sets: Array<{ id: number; setNumber: number }>,
  wleId = 100,
): WorkoutLogContract {
  return {
    id: 1,
    exercises: [{ id: wleId, exercise: { id: exerciseId, name: 'Bench Press' }, sets }],
  };
}

describe('applyExerciseMetrics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('saves each populated metric column against the matching workout log exercise', async () => {
    mockedAddMetric.mockResolvedValue({});

    const matched = await applyExerciseMetrics(workoutWithExercise(42), [strengthBlock()]);

    expect(mockedAddMetric).toHaveBeenCalledWith(100, 'reps', 10);
    expect(mockedAddMetric).toHaveBeenCalledWith(100, 'weight', 135);
    expect(matched).toBe(2);
  });

  it('submits duration as-is — it is tracked in seconds end to end, matching metric_types.time', async () => {
    mockedAddMetric.mockResolvedValue({});
    const block = strengthBlock({
      activityType: 'cardioIntense',
      rows: [{ set: 1, duration: '300', distance: '2' }],
    });

    await applyExerciseMetrics(workoutWithExercise(42), [block]);

    expect(mockedAddMetric).toHaveBeenCalledWith(100, 'time', 300);
    expect(mockedAddMetric).toHaveBeenCalledWith(100, 'distance', 2);
  });

  it('skips a block with no matching WorkoutLogExercise instead of throwing', async () => {
    const matched = await applyExerciseMetrics(workoutWithExercise(999), [strengthBlock({ exerciseId: 42 })]);

    expect(mockedAddMetric).not.toHaveBeenCalled();
    expect(matched).toBe(0);
  });

  it('skips columns with no value entered', async () => {
    const block = strengthBlock({ rows: [{ set: 1, reps: '', lbs: '' }] });

    const matched = await applyExerciseMetrics(workoutWithExercise(42), [block]);

    expect(mockedAddMetric).not.toHaveBeenCalled();
    expect(matched).toBe(0);
  });

  it("skips 'rounds' — no backend metric_type maps to it", async () => {
    mockedAddMetric.mockResolvedValue({});
    const block = strengthBlock({
      activityType: 'functional',
      rows: [{ set: 1, rounds: '3', reps: '12' }],
    });

    await applyExerciseMetrics(workoutWithExercise(42), [block]);

    expect(mockedAddMetric).toHaveBeenCalledTimes(1);
    expect(mockedAddMetric).toHaveBeenCalledWith(100, 'reps', 12);
  });

  it('treats a workout response with no exercises as matching nothing', async () => {
    const matched = await applyExerciseMetrics({ id: 1 }, [strengthBlock()]);

    expect(mockedAddMetric).not.toHaveBeenCalled();
    expect(matched).toBe(0);
  });

  describe('per-set path — exercise has real backend sets', () => {
    it('submits every row against its own set id, not just the first', async () => {
      mockedAddSetMetric.mockResolvedValue({});
      const block = strengthBlock({
        rows: [
          { set: 1, reps: '10', lbs: '135' },
          { set: 2, reps: '8', lbs: '145' },
          { set: 3, reps: '6', lbs: '155' },
        ],
      });
      const workout = workoutWithSets(42, [
        { id: 501, setNumber: 1 },
        { id: 502, setNumber: 2 },
        { id: 503, setNumber: 3 },
      ]);

      const matched = await applyExerciseMetrics(workout, [block]);

      expect(mockedAddSetMetric).toHaveBeenCalledWith(501, 'reps', 10);
      expect(mockedAddSetMetric).toHaveBeenCalledWith(501, 'weight', 135);
      expect(mockedAddSetMetric).toHaveBeenCalledWith(502, 'reps', 8);
      expect(mockedAddSetMetric).toHaveBeenCalledWith(502, 'weight', 145);
      expect(mockedAddSetMetric).toHaveBeenCalledWith(503, 'reps', 6);
      expect(mockedAddSetMetric).toHaveBeenCalledWith(503, 'weight', 155);
      expect(matched).toBe(6);
      expect(mockedAddMetric).not.toHaveBeenCalled();
    });

    it('skips a row whose set number has no matching backend set', async () => {
      mockedAddSetMetric.mockResolvedValue({});
      const block = strengthBlock({
        rows: [
          { set: 1, reps: '10', lbs: '135' },
          { set: 2, reps: '8', lbs: '145' },
        ],
      });
      // Only one real backend set exists (e.g. a set added client-side after
      // the routine was already saved) — set 2 has nowhere to submit to.
      const workout = workoutWithSets(42, [{ id: 501, setNumber: 1 }]);

      const matched = await applyExerciseMetrics(workout, [block]);

      expect(mockedAddSetMetric).toHaveBeenCalledTimes(2);
      expect(mockedAddSetMetric).toHaveBeenCalledWith(501, 'reps', 10);
      expect(mockedAddSetMetric).toHaveBeenCalledWith(501, 'weight', 135);
      expect(matched).toBe(2);
    });

    it('skips empty columns per row, same as the exercise-level path', async () => {
      mockedAddSetMetric.mockResolvedValue({});
      const block = strengthBlock({
        rows: [
          { set: 1, reps: '10', lbs: '' },
          { set: 2, reps: '', lbs: '145' },
        ],
      });
      const workout = workoutWithSets(42, [
        { id: 501, setNumber: 1 },
        { id: 502, setNumber: 2 },
      ]);

      const matched = await applyExerciseMetrics(workout, [block]);

      expect(mockedAddSetMetric).toHaveBeenCalledTimes(2);
      expect(mockedAddSetMetric).toHaveBeenCalledWith(501, 'reps', 10);
      expect(mockedAddSetMetric).toHaveBeenCalledWith(502, 'weight', 145);
      expect(matched).toBe(2);
    });
  });
});
