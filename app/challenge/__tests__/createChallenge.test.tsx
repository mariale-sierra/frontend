import { StyleSheet } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import CreateChallengeScreen from '../create';
import { useChallengeBuilder } from '../../../store/challengeBuilderStore';
import { getExerciseCount } from '../../../services/exercises/exercises.service';
import { CATEGORY_OPTIONS, LOCATION_OPTIONS } from '../../../constants/challengeCreateOptions';
import { activityColors, colors } from '../../../constants/theme';
import { USE_VIVID_CREATE_FLOW_BACKGROUND } from '../../../constants/screenBackground';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => {
  const t = (key: string, values?: { count?: number }) => (values?.count !== undefined ? `${key}:${values.count}` : key);
  const i18n = { language: 'en' };
  return { useTranslation: () => ({ t, i18n }) };
});
jest.mock('../../../services/challenge/challenge.service', () => ({
  createChallenge: jest.fn(),
}));
jest.mock('../../../services/exercises/exercises.service', () => ({
  getExerciseCount: jest.fn(),
}));
// The gradient behind the flow has its own tests; this records what the flow asks for.
const mockBackground = jest.fn();
jest.mock('../../../components/layout/screenBackground', () => ({
  __esModule: true,
  default: (props: { children: React.ReactNode }) => {
    mockBackground(props);
    return props.children;
  },
}));

const ACTIVITY_STEP = 1;

describe('the create-challenge flow, on the activity & location step', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useChallengeBuilder.getState().resetChallengeBuilder();
    useChallengeBuilder.getState().setCurrentStep(ACTIVITY_STEP);
    (getExerciseCount as jest.Mock).mockResolvedValue(12);
  });

  it('asks what kind of training: a title, and both the categories and the locations to pick from', async () => {
    await renderWithTheme(<CreateChallengeScreen />);

    expect(screen.getByText('challengeCreate.steps.activityLocation.title')).toBeTruthy();
    expect(screen.getByText('challengeCreate.fields.activity')).toBeTruthy();
    expect(screen.getByText('challengeCreate.fields.location')).toBeTruthy();
  });

  it('offers all six activity categories and all five locations', async () => {
    await renderWithTheme(<CreateChallengeScreen />);

    for (const option of [...CATEGORY_OPTIONS, ...LOCATION_OPTIONS]) {
      expect(screen.getByText(option.label)).toBeTruthy();
    }
    expect(CATEGORY_OPTIONS).toHaveLength(6);
    expect(LOCATION_OPTIONS).toHaveLength(5);
  });

  it('fills a picked category with its own activity color, and a location with the neutral primary', async () => {
    await renderWithTheme(<CreateChallengeScreen />);
    const fill = (label: string) => StyleSheet.flatten(screen.getByText(label).parent!.props.style).backgroundColor;

    await fireEvent.press(screen.getByText('Cardio low'));
    await fireEvent.press(screen.getByText('Gym'));

    expect(useChallengeBuilder.getState().selectedCategories).toEqual(['Cardio Low']);
    expect(useChallengeBuilder.getState().selectedLocations).toEqual(['Gym']);
    expect(fill('Cardio low')).toBe(activityColors.cardioLow);
    expect(fill('Gym')).toBe(colors.primary);
  });

  it('says how many exercises the choice unlocks', async () => {
    await renderWithTheme(<CreateChallengeScreen />);

    await waitFor(() => expect(screen.getByText('challengeCreate.fields.exercisesUnlockedCount:12')).toBeTruthy());
    expect(getExerciseCount).toHaveBeenCalledWith([], []);

    await fireEvent.press(screen.getByText('Strength'));
    await waitFor(() => expect(getExerciseCount).toHaveBeenLastCalledWith(['Strength'], []));
  });

  it('has no rainbow behind it: the paper gradient of the other screens, not the animated vivid one', async () => {
    await renderWithTheme(<CreateChallengeScreen />);

    const asked = mockBackground.mock.calls[0][0] as { gradientBackground?: boolean; vividGradient?: boolean };
    expect(USE_VIVID_CREATE_FLOW_BACKGROUND).toBe(false);
    expect(asked.gradientBackground).toBe(true);
    expect(asked.vividGradient).toBe(false);
  });
});
