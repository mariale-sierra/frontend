import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import SelectRoutineScreen from '../routine/select';
import { deleteRoutine, getRoutines } from '../../../services/routine/routine.service';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import type { RoutineSummary } from '../../../types/routine';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ day: '1' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../services/routine/routine.service', () => ({
  getRoutines: jest.fn(),
  deleteRoutine: jest.fn(),
}));
jest.mock('../../../utils/navigation', () => ({ safeBack: jest.fn() }));
// Decorative background only.
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  const Passthrough = ({ children }: { children?: unknown }) => children ?? null;
  return { __esModule: true, default: View, Defs: Passthrough, RadialGradient: Passthrough, Rect: () => null, Stop: () => null };
});
// Minimal stand-in exposing the popup's title and buttons.
jest.mock('../../../components/ui/confirmationPopup', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    ConfirmationPopup: ({
      visible,
      title,
      primaryButton,
      secondaryButton,
    }: {
      visible: boolean;
      title: string;
      primaryButton: { onPress: () => void };
      secondaryButton?: { onPress: () => void };
    }) =>
      visible
        ? React.createElement(
            View,
            null,
            React.createElement(Text, null, title),
            React.createElement(Pressable, { testID: 'confirm-primary', onPress: primaryButton.onPress }),
            secondaryButton ? React.createElement(Pressable, { testID: 'confirm-secondary', onPress: secondaryButton.onPress }) : null,
          )
        : null,
  };
});

const mockedGetRoutines = getRoutines as jest.Mock;
const mockedDeleteRoutine = deleteRoutine as jest.Mock;

const saved = (id: number, name: string): RoutineSummary => ({
  id: `backend-routine-${id}`,
  name,
  description: '',
  isRestDay: false,
  exercises: [],
  primaryActivity: null,
  activityTypes: [],
  backendId: id,
});

describe('Routine select — deleting a saved routine (B4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetRoutines.mockResolvedValue([saved(12, 'Push day'), saved(13, 'Pull day')]);
  });

  it('offers delete on backend routines only, never on the builder seed routine', async () => {
    const screen = await renderWithTheme(<SelectRoutineScreen />);

    await waitFor(() => expect(screen.getByText('Push day')).toBeTruthy());
    expect(screen.getByTestId('routine-delete-backend-routine-12')).toBeTruthy();
    expect(screen.getByTestId('routine-delete-backend-routine-13')).toBeTruthy();
    expect(screen.queryByTestId('routine-delete-seed-leg-day')).toBeNull();
  });

  it('asks for confirmation, deletes by backend id and drops the routine from the list', async () => {
    mockedDeleteRoutine.mockResolvedValue(undefined);
    const screen = await renderWithTheme(<SelectRoutineScreen />);
    await waitFor(() => expect(screen.getByText('Push day')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('routine-delete-backend-routine-12'), { stopPropagation: jest.fn() });
    expect(screen.getByText('routineSelect.deleteConfirmTitle')).toBeTruthy();
    expect(mockedDeleteRoutine).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('confirm-primary'));

    await waitFor(() => expect(screen.queryByText('Push day')).toBeNull());
    expect(mockedDeleteRoutine).toHaveBeenCalledWith(12);
    expect(screen.getByText('Pull day')).toBeTruthy();
    // The builder's own seed routine is untouched.
    expect(useRoutineBuilder.getState().savedRoutines.some((r) => r.id === 'seed-leg-day')).toBe(true);
  });

  it('clears a selection pointing at the deleted routine, so it can never be assigned to the day', async () => {
    mockedDeleteRoutine.mockResolvedValue(undefined);
    const screen = await renderWithTheme(<SelectRoutineScreen />);
    await waitFor(() => expect(screen.getByText('Push day')).toBeTruthy());

    await fireEvent.press(screen.getByText('Push day'));
    await fireEvent.press(screen.getByTestId('routine-delete-backend-routine-12'), { stopPropagation: jest.fn() });
    await fireEvent.press(screen.getByTestId('confirm-primary'));
    await waitFor(() => expect(screen.queryByText('Push day')).toBeNull());

    await fireEvent.press(screen.getByText('routineSelect.confirmRoutine'));

    const assigned = useRoutineBuilder.getState().routinesByDay[1];
    expect(assigned?.id).not.toBe('backend-routine-12');
  });

  it('cancelling deletes nothing', async () => {
    const screen = await renderWithTheme(<SelectRoutineScreen />);
    await waitFor(() => expect(screen.getByText('Push day')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('routine-delete-backend-routine-12'), { stopPropagation: jest.fn() });
    await fireEvent.press(screen.getByTestId('confirm-secondary'));

    expect(mockedDeleteRoutine).not.toHaveBeenCalled();
    expect(screen.getByText('Push day')).toBeTruthy();
  });

  it('keeps the routine listed when the delete request fails', async () => {
    mockedDeleteRoutine.mockRejectedValue(new Error('network'));
    const screen = await renderWithTheme(<SelectRoutineScreen />);
    await waitFor(() => expect(screen.getByText('Push day')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('routine-delete-backend-routine-12'), { stopPropagation: jest.fn() });
    await fireEvent.press(screen.getByTestId('confirm-primary'));

    await waitFor(() => expect(mockedDeleteRoutine).toHaveBeenCalled());
    expect(screen.getByText('Push day')).toBeTruthy();
  });
});
