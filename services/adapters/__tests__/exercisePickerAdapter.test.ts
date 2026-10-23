import {
  LOCATION_NAME_TO_CODE,
  buildMetricTemplateFromExerciseMetrics,
  toCandidate,
} from '../exercisePickerAdapter';
import type { ExerciseListRow, ExerciseMetricConfig } from '../../exercises/exercises.service';

// Sprint 10, B10: these helpers moved out of app/challenge/routine/exercises.tsx
// unchanged; the tests pin what the picker already did.
const row = (over: Partial<ExerciseListRow> = {}): ExerciseListRow => ({
  id: 12,
  slug: 'push-up',
  name: 'Push-up',
  imageUrl: 'https://cdn.example.com/push-up.jpg',
  category: { code: 'strength', name: 'Strength' },
  locations: [{ code: 'home', name: 'Home' }],
  region: null,
  trackingMode: 'sets',
  ...over,
});

const metric = (over: Partial<ExerciseMetricConfig>): ExerciseMetricConfig => ({
  id: 1,
  code: 'reps',
  name: 'Reps',
  valueType: 'int',
  defaultUnit: null,
  isRequired: true,
  isPrimary: true,
  ...over,
});

describe('toCandidate', () => {
  it('maps a catalog row into a picker candidate', () => {
    expect(toCandidate(row(), 'Anywhere')).toEqual({
      id: '12',
      name: 'Push-up',
      location: 'Home',
      metricType: 'strength',
      activityType: 'strength',
      muscleGroups: [],
      imageUrl: 'https://cdn.example.com/push-up.jpg',
      meta: 'Strength · Home',
    });
  });

  it('joins several locations and falls back to the default label when there are none', () => {
    expect(toCandidate(row({ locations: [{ code: 'gym', name: 'Gym' }, { code: 'home', name: 'Home' }] }), 'Anywhere').location).toBe(
      'Gym / Home',
    );
    expect(toCandidate(row({ locations: [] }), 'Anywhere').location).toBe('Anywhere');
  });

  it('uses the schema editor for anything not tracked by sets, and strength for an unknown category', () => {
    const candidate = toCandidate(row({ trackingMode: 'duration', category: { code: 'x', name: 'Unknown' } }), 'Anywhere');
    expect(candidate.metricType).toBe('schema');
    expect(candidate.activityType).toBe('strength');
  });

  it('maps a known category to its activity type', () => {
    expect(toCandidate(row({ category: { code: 'cardio_low', name: 'Cardio Low' } }), 'Anywhere').activityType).toBe('cardioLow');
  });
});

describe('buildMetricTemplateFromExerciseMetrics', () => {
  it('turns numeric metrics into number fields and seconds into a duration field', () => {
    expect(
      buildMetricTemplateFromExerciseMetrics(5, [
        metric({ code: 'distance', name: 'Distance', valueType: 'decimal', defaultUnit: 'km' }),
        metric({ code: 'time', name: 'Time', valueType: 'seconds' }),
      ]),
    ).toEqual({
      id: 'exercise-5-metrics',
      title: 'Exercise metrics',
      fields: [
        { key: 'distance', label: 'Distance', type: 'number', defaultValue: 10, unit: 'km', min: 0 },
        { key: 'time', label: 'Time', type: 'duration', defaultMinutes: 10, defaultSeconds: 0 },
      ],
    });
  });

  it('skips text/boolean metrics and returns null when nothing is renderable', () => {
    expect(
      buildMetricTemplateFromExerciseMetrics(5, [metric({ valueType: 'text' }), metric({ valueType: 'boolean' })]),
    ).toBeNull();
    expect(buildMetricTemplateFromExerciseMetrics(5, [])).toBeNull();
  });
});

describe('LOCATION_NAME_TO_CODE', () => {
  it('maps the challenge builder location names to backend codes', () => {
    expect(LOCATION_NAME_TO_CODE).toEqual({ Gym: 'gym', Home: 'home', Outdoor: 'outdoor', Studio: 'studio', Anywhere: 'anywhere' });
  });
});
