import {
  adaptationForRoutine,
  toSubstitutionPayload,
  toSubstitutionsParam,
  useWorkoutAdaptationStore,
  type WorkoutAdaptation,
} from '../workoutAdaptationStore';

const adaptation: WorkoutAdaptation = {
  routineId: 9,
  locationCode: 'home',
  locationName: 'Home',
  substitutions: [
    { originalExerciseId: 10, originalName: 'Barbell Squat', substituteExerciseId: 12, substituteName: 'Air Squat' },
    { originalExerciseId: 20, originalName: 'Row', substituteExerciseId: 22, substituteName: 'Towel Row' },
  ],
};

describe('workoutAdaptationStore', () => {
  beforeEach(() => useWorkoutAdaptationStore.setState({ byChallenge: {} }));

  it('keeps one adaptation per challenge and replaces it on repeated location changes', () => {
    const { setAdaptation } = useWorkoutAdaptationStore.getState();
    setAdaptation('c1', adaptation);
    setAdaptation('c2', { ...adaptation, locationCode: 'gym', locationName: 'Gym', substitutions: [] });
    setAdaptation('c1', { ...adaptation, locationCode: 'outdoor', locationName: 'Outdoor' });

    const { byChallenge } = useWorkoutAdaptationStore.getState();
    expect(byChallenge.c1.locationCode).toBe('outdoor');
    expect(byChallenge.c2.locationCode).toBe('gym');
  });

  it('clearAdaptation only removes that challenge', () => {
    const { setAdaptation, clearAdaptation } = useWorkoutAdaptationStore.getState();
    setAdaptation('c1', adaptation);
    setAdaptation('c2', adaptation);
    clearAdaptation('c1');
    clearAdaptation('does-not-exist');
    expect(Object.keys(useWorkoutAdaptationStore.getState().byChallenge)).toEqual(['c2']);
  });

  it('only applies an adaptation to the routine it was made for', () => {
    expect(adaptationForRoutine(adaptation, 9)).toBe(adaptation);
    expect(adaptationForRoutine(adaptation, 10)).toBeNull();
    expect(adaptationForRoutine(adaptation, null)).toBeNull();
    expect(adaptationForRoutine(undefined, 9)).toBeNull();
  });

  it('serialises the swaps for the query string and the progress body', () => {
    expect(toSubstitutionsParam(adaptation)).toBe('10:12,20:22');
    expect(toSubstitutionPayload(adaptation)).toEqual([
      { originalExerciseId: 10, substituteExerciseId: 12 },
      { originalExerciseId: 20, substituteExerciseId: 22 },
    ]);
    expect(toSubstitutionsParam({ ...adaptation, substitutions: [] })).toBe('');
  });
});
