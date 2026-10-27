import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useLocationSwitch } from '../useLocationSwitch';
import { getExerciseAlternatives, getLocationAvailability } from '../../services/exercises/exercises.service';

jest.mock('../../services/exercises/exercises.service', () => ({
  getLocationAvailability: jest.fn(),
  getExerciseAlternatives: jest.fn(),
}));

const availability = getLocationAvailability as jest.Mock;
const alternatives = getExerciseAlternatives as jest.Mock;

const EXERCISES = [
  { exerciseId: 10, name: 'Barbell Squat' },
  { exerciseId: 20, name: 'Row' },
];
const LOCATIONS = [
  { code: 'gym', name: 'Gym', requiresSubstitution: false, unsupportedExerciseIds: [] },
  { code: 'home', name: 'Home', requiresSubstitution: true, unsupportedExerciseIds: [10] },
  { code: 'outdoor', name: 'Outdoor', requiresSubstitution: true, unsupportedExerciseIds: [10, 20] },
];
const alt = (id: number, name: string) => ({ id, name, sameRegion: true });
const result = (list: ReturnType<typeof alt>[]) => ({
  exerciseId: 0,
  location: { code: 'x', name: 'X' },
  originalAvailableAtLocation: false,
  alternatives: list,
});

function setup(current = null as any) {
  return renderHook(() => useLocationSwitch({ visible: true, routineId: 9, exercises: EXERCISES, current }));
}

describe('useLocationSwitch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    availability.mockResolvedValue(LOCATIONS);
  });

  it('loads the routine locations and flags the ones that need swaps', async () => {
    const { result: hook } = await setup();
    await waitFor(() => expect(hook.current.locations).toHaveLength(3));
    expect(availability).toHaveBeenCalledWith([10, 20]);
    expect(hook.current.locations?.find((l) => l.code === 'home')?.requiresSubstitution).toBe(true);
  });

  it('a location where everything fits needs no swaps and applies with an empty list', async () => {
    const { result: hook } = await setup();
    await waitFor(() => expect(hook.current.locations).not.toBeNull());
    await act(async () => hook.current.selectLocation(LOCATIONS[0]));

    expect(alternatives).not.toHaveBeenCalled();
    expect(hook.current.items).toEqual([]);
    expect(hook.current.canApply).toBe(true);
    expect(hook.current.buildAdaptation()).toEqual({
      routineId: 9,
      locationCode: 'gym',
      locationName: 'Gym',
      substitutions: [],
    });
  });

  it('loads alternatives only for unsupported exercises, excluding the rest of the routine, and preselects the first', async () => {
    alternatives.mockResolvedValue(result([alt(12, 'Air Squat'), alt(13, 'Goblet Squat')]));
    const { result: hook } = await setup();
    await waitFor(() => expect(hook.current.locations).not.toBeNull());
    await act(async () => hook.current.selectLocation(LOCATIONS[1]));

    await waitFor(() => expect(hook.current.canApply).toBe(true));
    expect(alternatives).toHaveBeenCalledTimes(1);
    expect(alternatives).toHaveBeenCalledWith(10, 'home', [20]);

    await act(async () => hook.current.choose(10, 13));
    expect(hook.current.buildAdaptation()?.substitutions).toEqual([
      { originalExerciseId: 10, originalName: 'Barbell Squat', substituteExerciseId: 13, substituteName: 'Goblet Squat' },
    ]);
  });

  it('with no compatible alternative the exercise stays as written and the state stays valid', async () => {
    alternatives.mockResolvedValue(result([]));
    const { result: hook } = await setup();
    await waitFor(() => expect(hook.current.locations).not.toBeNull());
    await act(async () => hook.current.selectLocation(LOCATIONS[1]));

    await waitFor(() => expect(hook.current.canApply).toBe(true));
    expect(hook.current.withoutAlternatives.map((i) => i.exerciseId)).toEqual([10]);
    expect(hook.current.buildAdaptation()?.substitutions).toEqual([]);
  });

  it('a failed alternatives request blocks applying instead of passing as "no alternative"', async () => {
    alternatives.mockRejectedValue(new Error('network'));
    const { result: hook } = await setup();
    await waitFor(() => expect(hook.current.locations).not.toBeNull());
    await act(async () => hook.current.selectLocation(LOCATIONS[1]));

    await waitFor(() => expect(hook.current.hasFailedLookup).toBe(true));
    expect(hook.current.canApply).toBe(false);
    expect(hook.current.buildAdaptation()).toBeNull();
    expect(hook.current.items[0]).toMatchObject({ failed: true, chosenId: null });
  });

  it('repeated location changes start clean and ignore a late answer for the previous location', async () => {
    let resolveHome!: (v: unknown) => void;
    alternatives.mockImplementation((id: number, code: string) =>
      code === 'home'
        ? new Promise((r) => {
            resolveHome = r;
          })
        : Promise.resolve(result([alt(id + 100, `${code}-${id}`)])),
    );
    const { result: hook } = await setup();
    await waitFor(() => expect(hook.current.locations).not.toBeNull());

    await act(async () => hook.current.selectLocation(LOCATIONS[1])); // home, slow
    await act(async () => hook.current.backToLocations());
    await act(async () => hook.current.selectLocation(LOCATIONS[2])); // outdoor, fast
    await waitFor(() => expect(hook.current.canApply).toBe(true));
    expect(hook.current.items.map((i) => i.exerciseId)).toEqual([10, 20]);

    await act(async () => resolveHome(result([alt(999, 'late')])));
    expect(hook.current.selected?.code).toBe('outdoor');
    expect(hook.current.buildAdaptation()?.substitutions.map((s) => s.substituteExerciseId)).toEqual([110, 120]);
  });

  it('re-opening the saved location keeps the previous pick', async () => {
    alternatives.mockResolvedValue(result([alt(12, 'Air Squat'), alt(13, 'Goblet Squat')]));
    const current = {
      routineId: 9,
      locationCode: 'home',
      locationName: 'Home',
      substitutions: [
        { originalExerciseId: 10, originalName: 'Barbell Squat', substituteExerciseId: 13, substituteName: 'Goblet Squat' },
      ],
    };
    const { result: hook } = await setup(current);
    await waitFor(() => expect(hook.current.locations).not.toBeNull());
    await act(async () => hook.current.selectLocation(LOCATIONS[1]));
    await waitFor(() => expect(hook.current.canApply).toBe(true));
    expect(hook.current.items[0].chosenId).toBe(13);
  });

  // Regression (BUG-01): two exercises sharing alternatives both defaulted to
  // alternatives[0], giving "9:23,11:18,10:23" with canApply true — which the
  // backend rejects ("Exercise 23 is not a compatible substitute for 10 at
  // home"), dropping the whole adaptation.
  describe('one substitute never stands in for two exercises', () => {
    const ROUTINE = [
      { exerciseId: 9, name: 'Kettlebell Swing' },
      { exerciseId: 11, name: 'Rowing Intervals' },
      { exerciseId: 10, name: 'Battle Ropes' },
    ];
    const HOME = { code: 'home', name: 'Home', requiresSubstitution: true, unsupportedExerciseIds: [9, 10, 11] };
    const SHARED = [alt(23, 'Bodyweight Circuit'), alt(26, 'Resistance Band Workout')];

    function setupRoutine(current = null as any) {
      availability.mockResolvedValue([HOME]);
      return renderHook(() => useLocationSwitch({ visible: true, routineId: 2, exercises: ROUTINE, current }));
    }
    const chosen = (hook: { current: ReturnType<typeof useLocationSwitch> }) =>
      hook.current.buildAdaptation()?.substitutions.map((s) => `${s.originalExerciseId}:${s.substituteExerciseId}`);

    it('the reported Gym → Home case picks distinct substitutes', async () => {
      alternatives.mockImplementation((id: number) =>
        Promise.resolve(result(id === 11 ? [alt(18, 'Full Body Stretch Routine')] : SHARED)),
      );
      const { result: hook } = await setupRoutine();
      await waitFor(() => expect(hook.current.locations).not.toBeNull());
      await act(async () => hook.current.selectLocation(HOME));

      await waitFor(() => expect(hook.current.canApply).toBe(true));
      expect(alternatives).toHaveBeenCalledWith(9, 'home', [11, 10]);
      expect(chosen(hook)).toEqual(['9:23', '11:18', '10:26']);
    });

    it('when the only alternative is taken the second exercise stays as written', async () => {
      alternatives.mockResolvedValue(result([alt(23, 'Bodyweight Circuit')]));
      const { result: hook } = await setupRoutine();
      await waitFor(() => expect(hook.current.locations).not.toBeNull());
      await act(async () => hook.current.selectLocation(HOME));

      await waitFor(() => expect(hook.current.canApply).toBe(true));
      expect(chosen(hook)).toEqual(['9:23']);
      expect(hook.current.usedByOther(10, 23)).toBe('Kettlebell Swing');
      expect(hook.current.usedByOther(9, 23)).toBeNull();
    });

    it('a manual pick of a substitute already in use is ignored; a free one works and frees the old one', async () => {
      alternatives.mockImplementation((id: number) =>
        Promise.resolve(result(id === 11 ? [] : [...SHARED, alt(27, 'Mini Band Row')])),
      );
      const { result: hook } = await setupRoutine();
      await waitFor(() => expect(hook.current.locations).not.toBeNull());
      await act(async () => hook.current.selectLocation(HOME));
      await waitFor(() => expect(hook.current.canApply).toBe(true));
      expect(chosen(hook)).toEqual(['9:23', '10:26']);

      await act(async () => hook.current.choose(10, 23)); // taken by 9 → ignored
      expect(chosen(hook)).toEqual(['9:23', '10:26']);
      expect(hook.current.canApply).toBe(true);

      await act(async () => hook.current.choose(10, 27)); // free → works, frees 26
      await act(async () => hook.current.choose(9, 26));
      expect(chosen(hook)).toEqual(['9:26', '10:27']);
      expect(hook.current.canApply).toBe(true);
      expect(hook.current.withoutAlternatives.map((i) => i.exerciseId)).toEqual([11]);
    });

    it('re-opening the saved location restores both picks whatever order the answers arrive in', async () => {
      const resolvers: Record<number, (v: unknown) => void> = {};
      alternatives.mockImplementation(
        (id: number) =>
          new Promise((r) => {
            resolvers[id] = r;
          }),
      );
      const current = {
        routineId: 2,
        locationCode: 'home',
        locationName: 'Home',
        substitutions: [
          { originalExerciseId: 9, originalName: 'Kettlebell Swing', substituteExerciseId: 26, substituteName: 'Resistance Band Workout' },
          { originalExerciseId: 10, originalName: 'Battle Ropes', substituteExerciseId: 23, substituteName: 'Bodyweight Circuit' },
        ],
      };
      const { result: hook } = await setupRoutine(current);
      await waitFor(() => expect(hook.current.locations).not.toBeNull());
      await act(async () => hook.current.selectLocation(HOME));

      // Battle Ropes answers first: it must not grab 26, Kettlebell Swing's saved pick.
      await act(async () => resolvers[10](result(SHARED)));
      await act(async () => resolvers[11](result([])));
      await act(async () => resolvers[9](result(SHARED)));

      await waitFor(() => expect(hook.current.canApply).toBe(true));
      expect(chosen(hook)).toEqual(['9:26', '10:23']);
    });
  });
});
