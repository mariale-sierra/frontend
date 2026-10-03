import { adaptRoutineContract, buildActivityMetricTemplate } from '../routineAdapter';
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

// Real, confirmed bug (2026-09-21, reported live: "why does the stair
// climber / a bench ankle stretch have distance and duration?"): the
// RepDB-imported catalog has zero real exercise_metrics rows, so every
// schema-kind exercise added while building a challenge fell back to the
// SAME hardcoded distance+duration mock regardless of its real category —
// this is the category-aware fallback that replaced it.
describe('buildActivityMetricTemplate', () => {
  it('is duration only for flexibility and mind-body — no distance field', () => {
    for (const activityType of ['flexibility', 'mindBody'] as const) {
      const template = buildActivityMetricTemplate(102, activityType);

      expect(template?.fields).toEqual([
        { key: 'time', label: 'Duration', type: 'duration', defaultMinutes: 10, defaultSeconds: 0 },
      ]);
    }
  });

  it('is duration + distance for cardioIntense and cardioLow', () => {
    for (const activityType of ['cardioIntense', 'cardioLow'] as const) {
      const template = buildActivityMetricTemplate(570, activityType);

      expect(template?.fields).toEqual([
        { key: 'time', label: 'Duration', type: 'duration', defaultMinutes: 10, defaultSeconds: 0 },
        { key: 'distance', label: 'Distance', type: 'number', defaultValue: 5, unit: 'km', min: 0 },
      ]);
    }
  });

  it('is reps only for functional — no rounds field (no backend metric_type for it)', () => {
    const template = buildActivityMetricTemplate(134, 'functional');

    expect(template?.fields).toEqual([
      { key: 'reps', label: 'Reps', type: 'number', defaultValue: 10, min: 0 },
    ]);
  });

  it("builds a stable, per-exercise template id so it doesn't collide with the mock or a real-metrics template", () => {
    const template = buildActivityMetricTemplate(570, 'cardioIntense');

    expect(template?.id).toBe('exercise-570-activity-metrics');
  });

  it('drops the lbs column (no schema meaning outside the strength sets/reps editor) if ever asked for strength', () => {
    // Strength exercises are always 'sets'-tracked in practice, so they
    // never actually reach this fallback (handleAddSelected only calls it
    // for 'schema'-type exercises) — this just documents that 'lbs' would
    // never appear even if it somehow were.
    const template = buildActivityMetricTemplate(11, 'strength');

    expect(template?.fields.some((f) => f.key === 'lbs')).toBe(false);
  });
});
