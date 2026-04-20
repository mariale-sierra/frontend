import { create } from 'zustand';
import type { ActivityType } from '../constants/theme';

export type ExerciseMetricType = 'strength' | 'schema';

// Backend contract (future): each metric field is defined by DB/API and rendered by UI.
type MetricFieldBase = {
  key: string;
  label: string;
};

export type NumberMetricField = MetricFieldBase & {
  type: 'number';
  defaultValue: number;
  unit?: string;
  min?: number;
  max?: number;
};

export type DurationMetricField = MetricFieldBase & {
  type: 'duration';
  defaultMinutes: number;
  defaultSeconds: number;
};

export type MetricFieldDefinition = NumberMetricField | DurationMetricField;

export interface MetricTemplate {
  id: string;
  title: string;
  fields: MetricFieldDefinition[];
}

export interface SetRow {
  setNumber: number;
  reps: number;
  restMin: number;
  restSec: number;
}

export type SchemaMetricValue = number | { minutes: number; seconds: number };

export type ExerciseMetrics =
  | { kind: 'strength'; sets: SetRow[] }
  | {
      kind: 'schema';
      template: MetricTemplate;
      values: Record<string, SchemaMetricValue>;
    };

export interface ExerciseEntry {
  id: string;
  name: string;
  location: string;
  metricType: ExerciseMetricType;
  activityType: ActivityType;
  muscleGroups: string[];
  metrics: ExerciseMetrics;
  note: string;
}

export interface RoutineSummary {
  id: string;
  name: string;
  description: string;
  isRestDay: boolean;
  exercises: ExerciseEntry[];
  primaryActivity: ActivityType | null;
  activityTypes: ActivityType[];
}

interface RoutineBuilderState {
  dayIndex: number | null;
  routineName: string;
  routineDescription: string;
  isRestDay: boolean;
  exercises: ExerciseEntry[];
  savedRoutines: RoutineSummary[];
  routinesByDay: Record<number, RoutineSummary>;

  init: (day: number, routine?: RoutineSummary | null) => void;
  setRoutineName: (name: string) => void;
  setRoutineDescription: (description: string) => void;
  setIsRestDay: (value: boolean) => void;
  addExercise: (exercise: Omit<ExerciseEntry, 'metrics' | 'note'>) => void;
  updateStrengthSet: (exerciseId: string, setIndex: number, patch: Partial<SetRow>) => void;
  addStrengthSet: (exerciseId: string) => void;
  removeStrengthSet: (exerciseId: string, setIndex: number) => void;
  // Future backend handoff: call this with a raw API template; store validates at runtime.
  applyBackendMetricTemplate: (exerciseId: string, rawTemplate: unknown) => void;
  updateSchemaMetricNumber: (exerciseId: string, fieldKey: string, value: number) => void;
  updateSchemaMetricDuration: (exerciseId: string, fieldKey: string, patch: { minutes?: number; seconds?: number }) => void;
  reorderExercise: (from: number, to: number) => void;
  setNote: (exerciseId: string, note: string) => void;
  removeExercise: (exerciseId: string) => void;
  saveCurrentRoutineToDay: () => RoutineSummary | null;
  assignRoutineToDay: (day: number, routine: RoutineSummary) => void;
  assignRestDayToDay: (day: number) => void;
  unassignRoutineFromDay: (day: number) => void;
  pruneRoutinesAfterDay: (day: number) => void;
  resetBuilder: () => void;
}

const defaultSet = (): SetRow => ({
  setNumber: 1,
  reps: 8,
  restMin: 1,
  restSec: 0,
});

// Local template used while designing offline. Backend will eventually provide this.
const MOCK_SCHEMA_TEMPLATE: MetricTemplate = {
  id: 'mock-cardio-template',
  title: 'Exercise metrics',
  fields: [
    { key: 'distanceKm', label: 'Distance', type: 'number', defaultValue: 5, unit: 'km', min: 0 },
    { key: 'duration', label: 'Duration', type: 'duration', defaultMinutes: 20, defaultSeconds: 0 },
  ],
};

type UnknownRecord = Record<string, unknown>;

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function validateMetricField(rawField: unknown, index: number, errors: string[]): MetricFieldDefinition | null {
  if (!isObject(rawField)) {
    errors.push(`fields[${index}] must be an object`);
    return null;
  }

  if (!isNonEmptyString(rawField.key)) {
    errors.push(`fields[${index}].key must be a non-empty string`);
    return null;
  }

  if (!isNonEmptyString(rawField.label)) {
    errors.push(`fields[${index}].label must be a non-empty string`);
    return null;
  }

  if (rawField.type === 'number') {
    const defaultValue = toFiniteNumber(rawField.defaultValue);
    if (defaultValue == null) {
      errors.push(`fields[${index}].defaultValue must be a finite number for number fields`);
      return null;
    }

    const min = rawField.min == null ? undefined : toFiniteNumber(rawField.min);
    const max = rawField.max == null ? undefined : toFiniteNumber(rawField.max);
    if (rawField.min != null && min == null) {
      errors.push(`fields[${index}].min must be a finite number when provided`);
      return null;
    }
    if (rawField.max != null && max == null) {
      errors.push(`fields[${index}].max must be a finite number when provided`);
      return null;
    }

    if (min != null && max != null && min > max) {
      errors.push(`fields[${index}] has invalid range: min cannot be greater than max`);
      return null;
    }

    const unit = rawField.unit;
    if (unit != null && typeof unit !== 'string') {
      errors.push(`fields[${index}].unit must be a string when provided`);
      return null;
    }

    const normalizedUnit = typeof unit === 'string' ? unit : undefined;
    const normalizedMin = min == null ? undefined : min;
    const normalizedMax = max == null ? undefined : max;

    return {
      type: 'number',
      key: rawField.key,
      label: rawField.label,
      defaultValue,
      unit: normalizedUnit,
      min: normalizedMin,
      max: normalizedMax,
    };
  }

  if (rawField.type === 'duration') {
    const defaultMinutes = toFiniteNumber(rawField.defaultMinutes);
    const defaultSeconds = toFiniteNumber(rawField.defaultSeconds);

    if (defaultMinutes == null || defaultSeconds == null) {
      errors.push(`fields[${index}] duration defaults must be finite numbers`);
      return null;
    }

    if (defaultMinutes < 0 || defaultSeconds < 0) {
      errors.push(`fields[${index}] duration defaults cannot be negative`);
      return null;
    }

    return {
      type: 'duration',
      key: rawField.key,
      label: rawField.label,
      defaultMinutes,
      defaultSeconds,
    };
  }

  errors.push(`fields[${index}].type must be "number" or "duration"`);
  return null;
}

// Runtime validator for backend-provided metric templates.
// Backend team: this is the source-of-truth validation your API payload must satisfy.
export function validateMetricTemplate(rawTemplate: unknown): { ok: true; template: MetricTemplate } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (!isObject(rawTemplate)) {
    return { ok: false, errors: ['template must be an object'] };
  }

  const templateObj = rawTemplate as UnknownRecord;

  if (!isNonEmptyString(templateObj.id)) {
    errors.push('template.id must be a non-empty string');
  }

  if (!isNonEmptyString(templateObj.title)) {
    errors.push('template.title must be a non-empty string');
  }

  if (!Array.isArray(templateObj.fields) || templateObj.fields.length === 0) {
    errors.push('template.fields must be a non-empty array');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const rawFields = templateObj.fields as unknown[];

  const sanitizedFields = rawFields
    .map((field: unknown, index: number) => validateMetricField(field, index, errors))
    .filter((field): field is MetricFieldDefinition => Boolean(field));

  if (errors.length > 0 || sanitizedFields.length === 0) {
    return { ok: false, errors };
  }

  const templateId = templateObj.id as string;
  const templateTitle = templateObj.title as string;

  return {
    ok: true,
    template: {
      id: templateId,
      title: templateTitle,
      fields: sanitizedFields,
    },
  };
}

function createSchemaValues(template: MetricTemplate): Record<string, SchemaMetricValue> {
  return template.fields.reduce<Record<string, SchemaMetricValue>>((acc, field) => {
    if (field.type === 'number') {
      acc[field.key] = field.defaultValue;
      return acc;
    }

    acc[field.key] = {
      minutes: field.defaultMinutes,
      seconds: field.defaultSeconds,
    };
    return acc;
  }, {});
}

function createSchemaMetricsFromRawTemplate(rawTemplate: unknown): ExerciseMetrics | null {
  const validation = validateMetricTemplate(rawTemplate);

  if (!validation.ok) {
    console.warn('[RoutineBuilder] Invalid metric template from backend:', validation.errors.join(' | '));
    return null;
  }

  return {
    kind: 'schema',
    template: validation.template,
    values: createSchemaValues(validation.template),
  };
}

function createDefaultMetrics(metricType: ExerciseMetricType): ExerciseMetrics {
  switch (metricType) {
    case 'strength':
      return { kind: 'strength', sets: [defaultSet()] };
    case 'schema':
      // Keep local fallback for offline design. The backend path uses applyBackendMetricTemplate.
      return createSchemaMetricsFromRawTemplate(MOCK_SCHEMA_TEMPLATE) ?? { kind: 'strength', sets: [defaultSet()] };
  }
}

function cloneExercise(exercise: ExerciseEntry): ExerciseEntry {
  return {
    ...exercise,
    metrics: JSON.parse(JSON.stringify(exercise.metrics)) as ExerciseMetrics,
  };
}

function buildRoutineSummary(id: string, name: string, description: string, isRestDay: boolean, exercises: ExerciseEntry[]): RoutineSummary {
  return {
    id,
    name,
    description,
    isRestDay,
    exercises: exercises.map(cloneExercise),
    primaryActivity: isRestDay ? null : getPrimaryActivityType(exercises),
    activityTypes: isRestDay ? [] : getUniqueActivityTypes(exercises),
  };
}

export function getPrimaryActivityType(exercises: ExerciseEntry[]): ActivityType | null {
  if (exercises.length === 0) return null;
  const counts: Partial<Record<ActivityType, number>> = {};
  for (const exercise of exercises) {
    counts[exercise.activityType] = (counts[exercise.activityType] ?? 0) + 1;
  }
  return (Object.entries(counts) as [ActivityType, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

export function getUniqueActivityTypes(exercises: ExerciseEntry[]): ActivityType[] {
  return Array.from(new Set(exercises.map((exercise) => exercise.activityType)));
}

export function getRoutineLocationSummary(exercises: ExerciseEntry[]): string {
  const locations = Array.from(
    new Set(
      exercises
        .flatMap((exercise) => exercise.location.split('/'))
        .map((location) => location.trim())
        .filter(Boolean)
    )
  );

  return locations.join('/');
}

const seedRoutine = buildRoutineSummary(
  'seed-leg-day',
  'Leg Day for Glute Growth',
  'Lower-body focus with glutes first, then posterior-chain finishers.',
  false,
  [
    {
      id: 'seed-1',
      name: 'BULGARIAN DEADLIFTS',
      location: 'Home / Outdoor',
      metricType: 'strength',
      activityType: 'strength',
      muscleGroups: ['Glutes', 'Legs', 'Back'],
      metrics: { kind: 'strength', sets: [{ setNumber: 1, reps: 10, restMin: 1, restSec: 30 }] },
      note: '',
    },
    {
      id: 'seed-2',
      name: 'HIP THRUST',
      location: 'Gym',
      metricType: 'strength',
      activityType: 'strength',
      muscleGroups: ['Glutes'],
      metrics: { kind: 'strength', sets: [{ setNumber: 1, reps: 12, restMin: 1, restSec: 30 }] },
      note: '',
    },
  ]
);

export const useRoutineBuilder = create<RoutineBuilderState>((set, get) => ({
  dayIndex: null,
  routineName: '',
  routineDescription: '',
  isRestDay: false,
  exercises: [],
  savedRoutines: [seedRoutine],
  routinesByDay: {},

  init: (day, routine) => {
    const assignedRoutine = get().routinesByDay[day];
    const source = routine ?? assignedRoutine ?? null;
    if (!source) {
      set({
        dayIndex: day,
        routineName: '',
        routineDescription: '',
        isRestDay: false,
        exercises: [],
      });
      return;
    }

    set({
      dayIndex: day,
      routineName: source.name,
      routineDescription: source.description,
      isRestDay: source.isRestDay,
      exercises: source.exercises.map(cloneExercise),
    });
  },

  setRoutineName: (name) => set({ routineName: name }),

  setRoutineDescription: (routineDescription) => set({ routineDescription }),

  setIsRestDay: (isRestDay) => set({ isRestDay }),

  addExercise: (exercise) =>
    set((state) => ({
      isRestDay: false,
      exercises: [
        ...state.exercises,
        {
          ...exercise,
          metrics: createDefaultMetrics(exercise.metricType),
          note: '',
        },
      ],
    })),

  updateStrengthSet: (exerciseId, setIndex, patch) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.metrics.kind !== 'strength') {
          return exercise;
        }

        return {
          ...exercise,
          metrics: {
            kind: 'strength',
            sets: exercise.metrics.sets.map((row, index) => (
              index === setIndex ? { ...row, ...patch } : row
            )),
          },
        };
      }),
    })),

  addStrengthSet: (exerciseId) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.metrics.kind !== 'strength') {
          return exercise;
        }

        return {
          ...exercise,
          metrics: {
            kind: 'strength',
            sets: [
              ...exercise.metrics.sets,
              { ...defaultSet(), setNumber: exercise.metrics.sets.length + 1 },
            ],
          },
        };
      }),
    })),

  removeStrengthSet: (exerciseId, setIndex) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.metrics.kind !== 'strength') {
          return exercise;
        }

        return {
          ...exercise,
          metrics: {
            kind: 'strength',
            sets: exercise.metrics.sets
              .filter((_, index) => index !== setIndex)
              .map((row, index) => ({ ...row, setNumber: index + 1 })),
          },
        };
      }),
    })),

  applyBackendMetricTemplate: (exerciseId, rawTemplate) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        const schemaMetrics = createSchemaMetricsFromRawTemplate(rawTemplate);
        if (!schemaMetrics) {
          return exercise;
        }

        return {
          ...exercise,
          metricType: 'schema',
          metrics: schemaMetrics,
        };
      }),
    })),

  updateSchemaMetricNumber: (exerciseId, fieldKey, value) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.metrics.kind !== 'schema') {
          return exercise;
        }

        return {
          ...exercise,
          metrics: {
            ...exercise.metrics,
            values: {
              ...exercise.metrics.values,
              [fieldKey]: value,
            },
          },
        };
      }),
    })),

  updateSchemaMetricDuration: (exerciseId, fieldKey, patch) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.metrics.kind !== 'schema') {
          return exercise;
        }

        const currentValue = exercise.metrics.values[fieldKey];
        if (typeof currentValue === 'number' || currentValue == null) {
          return exercise;
        }

        return {
          ...exercise,
          metrics: {
            ...exercise.metrics,
            values: {
              ...exercise.metrics.values,
              [fieldKey]: {
                minutes: patch.minutes ?? currentValue.minutes,
                seconds: patch.seconds ?? currentValue.seconds,
              },
            },
          },
        };
      }),
    })),

  reorderExercise: (from, to) =>
    set((state) => {
      const nextExercises = [...state.exercises];
      const [movedExercise] = nextExercises.splice(from, 1);
      nextExercises.splice(to, 0, movedExercise);
      return { exercises: nextExercises };
    }),

  setNote: (exerciseId, note) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) => (
        exercise.id !== exerciseId ? exercise : { ...exercise, note }
      )),
    })),

  removeExercise: (exerciseId) =>
    set((state) => ({
      exercises: state.exercises.filter((exercise) => exercise.id !== exerciseId),
    })),

  saveCurrentRoutineToDay: () => {
    const state = get();
    if (state.dayIndex == null) {
      return null;
    }

    const routineName = state.isRestDay ? 'Rest Day' : state.routineName.trim() || `Day ${state.dayIndex} Routine`;
    const routineDescription = state.isRestDay
      ? state.routineDescription.trim() || 'Recovery, mobility, or complete rest.'
      : state.routineDescription.trim();

    const routine = buildRoutineSummary(
      state.isRestDay ? `rest-day-${state.dayIndex}` : `${routineName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      routineName,
      routineDescription,
      state.isRestDay,
      state.exercises
    );

    set((currentState) => {
      const nextSavedRoutines = routine.isRestDay
        ? currentState.savedRoutines
        : [
            routine,
            ...currentState.savedRoutines.filter((item) => item.name.toLowerCase() !== routine.name.toLowerCase()),
          ];

      return {
        routinesByDay: {
          ...currentState.routinesByDay,
          [state.dayIndex as number]: routine,
        },
        savedRoutines: nextSavedRoutines,
      };
    });

    return routine;
  },

  assignRoutineToDay: (day, routine) =>
    set((state) => ({
      routinesByDay: {
        ...state.routinesByDay,
        [day]: buildRoutineSummary(routine.id, routine.name, routine.description, routine.isRestDay, routine.exercises),
      },
    })),

  assignRestDayToDay: (day) =>
    set((state) => ({
      routinesByDay: {
        ...state.routinesByDay,
        [day]: buildRoutineSummary(
          `rest-day-${day}`,
          'Rest Day',
          'Recovery, mobility, or complete rest.',
          true,
          []
        ),
      },
    })),

  unassignRoutineFromDay: (day) =>
    set((state) => {
      const nextRoutinesByDay = { ...state.routinesByDay };
      delete nextRoutinesByDay[day];

      return {
        routinesByDay: nextRoutinesByDay,
      };
    }),

  pruneRoutinesAfterDay: (day) =>
    set((state) => ({
      routinesByDay: Object.fromEntries(
        Object.entries(state.routinesByDay).filter(([key]) => Number(key) <= day)
      ),
    })),

  resetBuilder: () => set({
    dayIndex: null,
    routineName: '',
    routineDescription: '',
    isRestDay: false,
    exercises: [],
  }),
}));