import { addMetricToWorkoutLogExercise, addMetricToWorkoutLogExerciseSet } from '../metrics.service';
import { applyExerciseMetrics } from '../applyExerciseMetrics';
import type { ExerciseMetricsBlock } from '../../../types/metrics';
import type { WorkoutLogContract } from '../../../types/workout-log';

jest.mock('../metrics.service', () => ({
  addMetricToWorkoutLogExercise: jest.fn(),
  addMetricToWorkoutLogExerciseSet: jest.fn(),
}));

const addMetric = addMetricToWorkoutLogExercise as jest.Mock;
const addSetMetric = addMetricToWorkoutLogExerciseSet as jest.Mock;

const block = (exerciseId: number, overrides: Partial<ExerciseMetricsBlock> = {}): ExerciseMetricsBlock => ({
  id: `re-${exerciseId}`,
  exerciseId,
  name: 'x',
  activityType: 'strength',
  location: 'anywhere',
  notes: '',
  rows: [{ set: 1, reps: '15' }],
  ...overrides,
});

// The saved workout holds the user's EFFECTIVE exercise (12), not the routine's (10).
const workout = (sets?: Array<{ id: number; setNumber: number }>): WorkoutLogContract => ({
  id: 1,
  exercises: [
    { id: 500, exercise: { id: 12, name: 'Air Squat' }, sets },
    { id: 501, exercise: { id: 20, name: 'Row' } },
  ],
});

describe('applyExerciseMetrics with a substituted exercise (B7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    addMetric.mockResolvedValue({});
    addSetMetric.mockResolvedValue({});
  });

  it('attributes the values to the substitute workout-log exercise', async () => {
    await applyExerciseMetrics(workout(), [block(12)]);
    expect(addMetric).toHaveBeenCalledTimes(1);
    expect(addMetric).toHaveBeenCalledWith(500, 'reps', 15);
  });

  it('never writes a value for the original exercise that is no longer in the workout', async () => {
    const saved = await applyExerciseMetrics(workout(), [block(10)]);
    expect(addMetric).not.toHaveBeenCalled();
    expect(addSetMetric).not.toHaveBeenCalled();
    expect(saved).toBe(0);
  });

  it('keeps per-set attribution on the substitute and leaves other exercises alone', async () => {
    await applyExerciseMetrics(workout([{ id: 900, setNumber: 1 }]), [block(12)]);
    expect(addSetMetric).toHaveBeenCalledWith(900, 'reps', 15);
    expect(addMetric).not.toHaveBeenCalled();
  });
});
