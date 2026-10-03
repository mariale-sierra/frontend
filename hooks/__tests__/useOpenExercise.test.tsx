import { Pressable, Text as RNText } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import i18n from '../../i18n';
import { getExerciseList } from '../../services/exercises/exercises.service';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { useOpenExercise } from '../useOpenExercise';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../services/exercises/exercises.service', () => ({ getExerciseList: jest.fn() }));

const listExercises = getExerciseList as jest.Mock;
const page = (rows: { id: number; name: string }[]) => ({ data: rows, page: 1, pageSize: 20, total: rows.length });

// A row that asks for an exercise, and shows which one is being looked up.
function Probe({ name }: { name: string }) {
  const { openExercise, openingKey } = useOpenExercise();
  return (
    <>
      <Pressable onPress={() => openExercise(name, 'row-1')}>
        <RNText>open</RNText>
      </Pressable>
      <RNText>{`opening:${openingKey ?? 'none'}`}</RNText>
    </>
  );
}

describe('useOpenExercise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useErrorNotificationStore.setState({ visible: false, config: { message: '' } });
  });

  it('looks the exercise up by its name and opens its screen', async () => {
    listExercises.mockResolvedValue(page([{ id: 42, name: 'HIP THRUST' }]));
    const screen = await renderWithProviders(<Probe name="HIP THRUST" />);

    await fireEvent.press(screen.getByText('open'));

    expect(listExercises).toHaveBeenCalledWith(expect.objectContaining({ search: 'HIP THRUST' }));
    expect(mockPush).toHaveBeenCalledWith('/exercises/42');
    expect(useErrorNotificationStore.getState().visible).toBe(false);
  });

  it('opens the exact match among the exercises that merely contain the name', async () => {
    listExercises.mockResolvedValue(
      page([
        { id: 1, name: 'Goblet Squat' },
        { id: 2, name: 'Squat' },
      ]),
    );
    const screen = await renderWithProviders(<Probe name="SQUAT" />);

    await fireEvent.press(screen.getByText('open'));

    expect(mockPush).toHaveBeenCalledWith('/exercises/2');
  });

  it('says so, and stays where it is, when there is no such exercise', async () => {
    listExercises.mockResolvedValue(page([]));
    const screen = await renderWithProviders(<Probe name="Nothing" />);

    await fireEvent.press(screen.getByText('open'));

    expect(mockPush).not.toHaveBeenCalled();
    expect(useErrorNotificationStore.getState()).toMatchObject({
      visible: true,
      config: { message: i18n.t('challengeRoutineDay.exerciseOpenFailed') },
    });
  });

  it('says so, and stays where it is, when the lookup fails', async () => {
    listExercises.mockRejectedValue(new Error('offline'));
    const screen = await renderWithProviders(<Probe name="Hip Thrust" />);

    await fireEvent.press(screen.getByText('open'));

    expect(mockPush).not.toHaveBeenCalled();
    expect(useErrorNotificationStore.getState().visible).toBe(true);
    // And the row is free to try again.
    expect(screen.getByText('opening:none')).toBeTruthy();
  });

  it('tells which row is being looked up while it runs, and ignores a second tap meanwhile', async () => {
    let resolve: (value: ReturnType<typeof page>) => void = () => undefined;
    listExercises.mockReturnValue(new Promise((done) => (resolve = done)));
    const screen = await renderWithProviders(<Probe name="Hip Thrust" />);

    // The press waits for the handler, which waits for the lookup: don't await it yet.
    const firstTap = fireEvent.press(screen.getByText('open'));
    await screen.findByText('opening:row-1');

    const secondTap = fireEvent.press(screen.getByText('open'));
    resolve(page([{ id: 7, name: 'Hip Thrust' }]));
    await Promise.all([firstTap, secondTap]);

    expect(listExercises).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(screen.getByText('opening:none')).toBeTruthy();
  });
});
