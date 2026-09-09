import { adaptRoutineContract } from '../routineAdapter';
import type { RoutineContract } from '../../../types/routine';

describe('adaptRoutineContract', () => {
  it('maps persisted routine exercises into the builder model in backend order', () => {
    const routine: RoutineContract = {
      id: 12,
      name: 'My lower body routine',
      description: 'Three exercises',
      routine_exercises: [
        {
          id: 'routine-exercise-2',
          exercise_id: 22,
          order_index: 2,
          exercise: {
            id: 22,
            name: 'Run',
            tracking_mode: 'single',
            category_maps: [{ isPrimary: true, category: { code: 'cardio-low', name: 'Cardio Low' } }],
            location_maps: [{ isPrimary: true, location: { code: 'outdoor', name: 'Outdoor' } }],
          },
          targets: [
            {
              metricType: { code: 'time', name: 'Time', valueType: 'seconds' },
              target_value_seconds: 1500,
            },
          ],
        },
        {
          id: 'routine-exercise-1',
          exercise_id: 11,
          order_index: 1,
          notes: 'Controlled tempo',
          exercise: {
            id: 11,
            name: 'Squat',
            tracking_mode: 'sets',
            category_maps: [{ isPrimary: true, category: { code: 'strength', name: 'Strength' } }],
            location_maps: [{ isPrimary: true, location: { code: 'gym', name: 'Gym' } }],
          },
          sets: [
            {
              set_number: 1,
              rest_seconds_after: 60,
              targets: [
                {
                  metricType: { code: 'reps', name: 'Reps', valueType: 'int' },
                  target_value_int: 10,
                },
              ],
            },
          ],
        },
      ],
    };

    const result = adaptRoutineContract(routine);

    expect(result).toMatchObject({
      id: 'backend-routine-12',
      backendId: 12,
      name: 'My lower body routine',
      activityTypes: ['strength', 'cardioLow'],
      primaryActivity: 'strength',
    });
    expect(result.exercises.map((exercise) => exercise.name)).toEqual(['Squat', 'Run']);
    expect(result.exercises[0]).toMatchObject({
      backendExerciseId: 11,
      location: 'Gym',
      note: 'Controlled tempo',
      metrics: {
        kind: 'strength',
        sets: [{ setNumber: 1, reps: 10, restMin: 1, restSec: 0 }],
      },
    });
    expect(result.exercises[1]).toMatchObject({
      backendExerciseId: 22,
      activityType: 'cardioLow',
      metrics: {
        kind: 'schema',
        values: { time: { minutes: 25, seconds: 0 } },
      },
    });
  });

  it('keeps an empty persisted routine usable by the picker', () => {
    const result = adaptRoutineContract({ id: 19, name: 'Empty routine' });

    expect(result).toMatchObject({
      id: 'backend-routine-19',
      backendId: 19,
      isRestDay: false,
      exercises: [],
      primaryActivity: null,
      activityTypes: [],
    });
  });
});
