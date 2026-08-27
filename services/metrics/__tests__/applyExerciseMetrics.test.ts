import { addMetricToWorkoutLogExercise } from '../metrics.service';
import { applyExerciseMetrics } from '../applyExerciseMetrics';
import type { ExerciseMetricsBlock } from '../../../types/metrics';
import type { WorkoutLogContract } from '../../../types/workout-log';

jest.mock('../metrics.service', () => ({
  addMetricToWorkoutLogExercise: jest.fn(),
}));

const mockedAddMetric = addMetricToWorkoutLogExercise as jest.Mock;

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

describe('applyExerciseMetrics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('saves each populated metric column against the matching workout log exercise', async () => {
    mockedAddMetric.mockResolvedValue({});

    const matched = await applyExerciseMetrics(workoutWithExercise(42), [strengthBlock()]);

    expect(mockedAddMetric).toHaveBeenCalledWith(100, 'reps', 10);
    expect(mockedAddMetric).toHaveBeenCalledWith(100, 'weight', 135);
    expect(matched).toBe(2);
  });

  it('submits duration as-is — it is tracked in seconds end to end, matching metric_types.duration', async () => {
    mockedAddMetric.mockResolvedValue({});
    const block = strengthBlock({
      activityType: 'cardioIntense',
      rows: [{ set: 1, duration: '300', distance: '2' }],
    });

    await applyExerciseMetrics(workoutWithExercise(42), [block]);

    expect(mockedAddMetric).toHaveBeenCalledWith(100, 'duration', 300);
    expect(mockedAddMetric).toHaveBeenCalledWith(100, 'distanceKm', 2);
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
});
