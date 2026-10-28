import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { LocationSwitchSheet } from '../LocationSwitchSheet';
import { getExerciseAlternatives, getLocationAvailability } from '../../../../services/exercises/exercises.service';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../../services/exercises/exercises.service', () => ({
  getLocationAvailability: jest.fn(),
  getExerciseAlternatives: jest.fn(),
}));

const EXERCISES = [{ exerciseId: 10, name: 'barbell squat' }];

function renderSheet() {
  return renderWithTheme(
    <LocationSwitchSheet
      visible
      onClose={jest.fn()}
      routineId={9}
      exercises={EXERCISES}
      current={null}
      onApply={jest.fn()}
      onReset={jest.fn()}
    />,
  );
}

// Sprint 10, B2: the sheet asks where you train today and explains what
// happens to the exercises before you pick, and what to do once you picked.
describe('LocationSwitchSheet copy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getLocationAvailability as jest.Mock).mockResolvedValue([
      { code: 'home', name: 'Home', requiresSubstitution: true, unsupportedExerciseIds: [10] },
    ]);
    (getExerciseAlternatives as jest.Mock).mockResolvedValue({ alternatives: [{ id: 11, name: 'goblet squat', sameRegion: true }] });
  });

  it('asks where you train today and explains that only your workout changes', async () => {
    const screen = await renderSheet();

    expect(screen.getByText('challengeRoutineDay.location.sheetTitle')).toBeTruthy();
    expect(screen.getByTestId('location-sheet-hint')).toBeTruthy();
    expect(screen.getByText('challengeRoutineDay.location.sheetHint')).toBeTruthy();
  });

  it('after picking a place, says what to choose for each exercise that does not work there', async () => {
    const screen = await renderSheet();
    await waitFor(() => expect(screen.getByLabelText('Home')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Home'));

    await waitFor(() => expect(screen.getByText('challengeRoutineDay.location.substitutionsHint')).toBeTruthy());
    expect(screen.queryByTestId('location-sheet-hint')).toBeNull();
  });

  // Sprint 10: each place shows its own icon (the same ones as the exercise catalog).
  it("shows each place's icon", async () => {
    (getLocationAvailability as jest.Mock).mockResolvedValue([
      { code: 'home', name: 'Home', requiresSubstitution: false, unsupportedExerciseIds: [] },
      { code: 'gym', name: 'Gym', requiresSubstitution: false, unsupportedExerciseIds: [] },
    ]);
    const screen = await renderSheet();
    await waitFor(() => expect(screen.getByLabelText('Gym')).toBeTruthy());

    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('home-outline');
    expect(tree).toContain('barbell-outline');
  });
});
