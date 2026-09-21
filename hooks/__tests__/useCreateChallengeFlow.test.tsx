import { Alert } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useCreateChallengeFlow } from '../useCreateChallengeFlow';
import { useChallengeBuilder } from '../../store/challengeBuilderStore';
import { useRoutineBuilder } from '../../store/routineBuilderStore';
import { createChallenge } from '../../services/challenge/challenge.service';

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
      'cycle',
      'durationVisibility',
      'review',
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
    expect(result.current.activeStep.kind).toBe('cycle');
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
