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

  it('a failed alternatives request is treated as no alternative, never as a crash', async () => {
    alternatives.mockRejectedValue(new Error('network'));
    const { result: hook } = await setup();
    await waitFor(() => expect(hook.current.locations).not.toBeNull());
    await act(async () => hook.current.selectLocation(LOCATIONS[1]));

    await waitFor(() => expect(hook.current.canApply).toBe(true));
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
});
