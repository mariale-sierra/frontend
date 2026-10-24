import { Alert } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useCreateChallengeFlow } from '../useCreateChallengeFlow';
import { useChallengeBuilder } from '../../store/challengeBuilderStore';
import { useRoutineBuilder } from '../../store/routineBuilderStore';
import { createChallenge } from '../../services/challenge/challenge.service';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
jest.mock('react-i18next', () => {
  const t = (key: string) => key;
  const i18n = { language: 'en' };
  return { useTranslation: () => ({ t, i18n }) };
});
jest.mock('../../services/challenge/challenge.service', () => ({
  createChallenge: jest.fn(),
}));

const REST_DAY = { name: 'Rest day', description: '', isRestDay: true, exercises: [] } as never;

// A finished form, but for the categories and locations: named, public, and every day of
// the (one-day) cycle set.
function fillEverythingButTheActivityStep() {
  useChallengeBuilder.setState({ title: 'My challenge', visibility: 'Public', cycleLengthDays: 1 });
  useRoutineBuilder.setState({ routinesByDay: { 1: REST_DAY } });
}

async function renderFlow() {
  return renderHook(() => useCreateChallengeFlow());
}

describe('useCreateChallengeFlow — the activity & location step', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    useChallengeBuilder.getState().resetChallengeBuilder();
    useRoutineBuilder.setState({ routinesByDay: {} });
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (createChallenge as jest.Mock).mockResolvedValue({ id: 'challenge-1' });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('is in the flow, right after the name: the categories and locations come before the cycle', async () => {
    const { result } = await renderFlow();

    expect(result.current.steps.map((step) => step.kind)).toEqual([
      'name',
      'activityLocation',
      'cycleLength',
      'cycleFill',
      'visibility',
      'review',
      'rules',
    ]);
  });

  it('will not go on until there is at least one category and one location', async () => {
    const { result } = await renderFlow();
    await act(async () => useChallengeBuilder.getState().setCurrentStep(1));
    expect(result.current.activeStep.kind).toBe('activityLocation');

    await act(async () => result.current.handleNext());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(result.current.activeStep.kind).toBe('activityLocation');

    // A category alone is not enough.
    await act(async () => result.current.toggleCategory('Strength'));
    await act(async () => result.current.handleNext());
    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(result.current.activeStep.kind).toBe('activityLocation');

    await act(async () => result.current.toggleLocation('Gym'));
    await act(async () => result.current.handleNext());
    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(result.current.activeStep.kind).toBe('cycleLength');
  });

  it('lets a category or location be chosen and un-chosen', async () => {
    const { result } = await renderFlow();

    await act(async () => result.current.toggleCategory('Strength'));
    await act(async () => result.current.toggleCategory('Cardio Low'));
    await act(async () => result.current.toggleLocation('Gym'));
    expect(result.current.selectedCategories).toEqual(['Strength', 'Cardio Low']);
    expect(result.current.selectedLocations).toEqual(['Gym']);

    await act(async () => result.current.toggleCategory('Strength'));
    expect(result.current.selectedCategories).toEqual(['Cardio Low']);
  });

  it('is required to start the challenge, whatever else is filled in', async () => {
    fillEverythingButTheActivityStep();
    const { result } = await renderFlow();

    expect(result.current.missingConfigurationFields).toEqual([
      'challengeCreate.validation.exerciseCategories',
      'challengeCreate.validation.challengeLocation',
    ]);

    await act(async () => result.current.handleActionPress());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(createChallenge).not.toHaveBeenCalled();
  });

  it("creates the challenge with the categories and locations that were chosen — what limits the exercises", async () => {
    fillEverythingButTheActivityStep();
    useChallengeBuilder.setState({ selectedCategories: ['Strength', 'Cardio Low'], selectedLocations: ['Gym', 'Home'] });
    const { result } = await renderFlow();

    expect(result.current.missingConfigurationFields).toEqual([]);
    await act(async () => result.current.handleActionPress());

    expect(createChallenge).toHaveBeenCalledWith(
      expect.objectContaining({ categories: ['Strength', 'Cardio Low'], locations: ['Gym', 'Home'] }),
    );
  });
});

const WORKOUT = (name: string) =>
  ({ name, description: '', isRestDay: false, exercises: [], primaryActivity: null }) as never;

describe('useCreateChallengeFlow — cycle & length (53A) and fill in your cycle (53B)', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    useChallengeBuilder.getState().resetChallengeBuilder();
    useRoutineBuilder.setState({ routinesByDay: {} });
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (createChallenge as jest.Mock).mockResolvedValue({ id: 'challenge-1' });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('keeps the cycle at least 1 day and the challenge never shorter than its cycle', async () => {
    const { result } = await renderFlow();

    await act(async () => result.current.setCycleLengthDays(0));
    expect(result.current.cycleLengthDays).toBe(1);

    await act(async () => result.current.setDurationDays(10));
    await act(async () => result.current.setCycleLengthDays(12));
    expect(result.current.cycleLengthDays).toBe(12);
    expect(result.current.durationDays).toBe(12);

    await act(async () => result.current.setDurationDays(5));
    expect(result.current.durationDays).toBe(12);
  });

  it('adding a day past the challenge length stretches the length too', async () => {
    useChallengeBuilder.setState({ cycleLengthDays: 4, durationDays: 4 });
    const { result } = await renderFlow();

    await act(async () => result.current.addCycleDay());

    expect(result.current.cycleLengthDays).toBe(5);
    expect(result.current.durationDays).toBe(5);
  });

  it('shrinking the cycle drops the routines of the days it removes — growing it back gives empty days', async () => {
    useChallengeBuilder.setState({ cycleLengthDays: 3 });
    useRoutineBuilder.setState({ routinesByDay: { 1: WORKOUT('A'), 2: WORKOUT('B'), 3: WORKOUT('C') } });
    const { result } = await renderFlow();

    await act(async () => result.current.setCycleLengthDays(1));
    expect(Object.keys(useRoutineBuilder.getState().routinesByDay)).toEqual(['1']);

    await act(async () => result.current.setCycleLengthDays(3));
    expect(result.current.getDayStatus(2)).toBe('empty');
    expect(result.current.getDayStatus(3)).toBe('empty');
  });

  it('removing a day with × renumbers the days after it', async () => {
    useChallengeBuilder.setState({ cycleLengthDays: 3 });
    useRoutineBuilder.setState({ routinesByDay: { 1: WORKOUT('A'), 2: WORKOUT('B'), 3: REST_DAY } });
    const { result } = await renderFlow();

    await act(async () => result.current.removeCycleDay(1));

    expect(result.current.cycleLengthDays).toBe(2);
    expect(result.current.getDayRoutineLabel(1)).toBe('B');
    expect(result.current.getDayStatus(2)).toBe('rest');
  });

  it('points at the first empty day, and blocks Continue on 53B until every day is set', async () => {
    useChallengeBuilder.setState({ cycleLengthDays: 3, currentStep: 3 });
    useRoutineBuilder.setState({ routinesByDay: { 1: WORKOUT('A'), 3: REST_DAY } });
    const { result } = await renderFlow();

    expect(result.current.activeStep.kind).toBe('cycleFill');
    expect(result.current.firstUnfilledDay).toBe(2);
    expect(result.current.hasRoutineForEveryDay).toBe(false);

    await act(async () => result.current.handleNext());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(result.current.activeStep.kind).toBe('cycleFill');

    await act(async () => useRoutineBuilder.setState({ routinesByDay: { 1: WORKOUT('A'), 2: WORKOUT('B'), 3: REST_DAY } }));
    expect(result.current.firstUnfilledDay).toBeNull();
    await act(async () => result.current.handleNext());
    expect(result.current.activeStep.kind).toBe('visibility');
  });

  it('creates the challenge with its real length, even when it does not divide into whole cycles', async () => {
    useChallengeBuilder.setState({
      title: 'My challenge',
      visibility: 'Public',
      cycleLengthDays: 4,
      durationDays: 30,
      selectedCategories: ['Strength'],
      selectedLocations: ['Gym'],
    });
    useRoutineBuilder.setState({
      routinesByDay: { 1: WORKOUT('A'), 2: WORKOUT('B'), 3: WORKOUT('C'), 4: REST_DAY },
    });
    const { result } = await renderFlow();

    await act(async () => result.current.handleActionPress());

    expect(createChallenge).toHaveBeenCalledWith(
      expect.objectContaining({ duration_days: 30, cycle_length_days: 4 }),
    );
    // Then on to Mine, where the new challenge is — like joining one from Browse.
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/challenges?view=mine');
  });
});
