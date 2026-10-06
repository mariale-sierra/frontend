import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { RoutinePickerCard } from '../routinePickerCard';
import type { RoutineSummary } from '../../../../types/routine';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const routine = (overrides: Partial<RoutineSummary> = {}): RoutineSummary => ({
  id: 'backend-routine-12',
  name: 'Push day',
  description: '',
  isRestDay: false,
  exercises: [],
  primaryActivity: null,
  activityTypes: [],
  backendId: 12,
  ...overrides,
});

describe('RoutinePickerCard — delete action (B4)', () => {
  it('shows no delete action unless onDelete is given', async () => {
    const screen = await renderWithTheme(
      <RoutinePickerCard routine={routine()} selected={false} onSelect={jest.fn()} onOpen={jest.fn()} />,
    );

    expect(screen.queryByTestId('routine-delete-backend-routine-12')).toBeNull();
  });

  it('calls onDelete only — never selecting or opening the routine', async () => {
    const onSelect = jest.fn();
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    const screen = await renderWithTheme(
      <RoutinePickerCard routine={routine()} selected={false} onSelect={onSelect} onOpen={onOpen} onDelete={onDelete} />,
    );

    await fireEvent.press(screen.getByTestId('routine-delete-backend-routine-12'), { stopPropagation: jest.fn() });

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
