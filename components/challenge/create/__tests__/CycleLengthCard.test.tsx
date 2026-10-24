import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { CycleLengthCard } from '../CycleLengthCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

async function renderCard(cycleLengthDays: number, durationDays: number) {
  const onChangeCycleLength = jest.fn();
  const onChangeDuration = jest.fn();
  const screen = await renderWithTheme(
    <CycleLengthCard
      cycleLengthDays={cycleLengthDays}
      durationDays={durationDays}
      onChangeCycleLength={onChangeCycleLength}
      onChangeDuration={onChangeDuration}
      minCycleLength={1}
      maxCycleLength={28}
      maxDuration={365}
    />,
  );
  return { screen, onChangeCycleLength, onChangeDuration };
}

describe('CycleLengthCard (53A)', () => {
  it('shows both values and steps each one by a day', async () => {
    const { screen, onChangeCycleLength, onChangeDuration } = await renderCard(4, 30);

    expect(screen.getByTestId('cycle-length-stepper-value').props.children).toBe(4);
    expect(screen.getByTestId('duration-stepper-value').props.children).toBe(30);

    await fireEvent.press(screen.getByTestId('cycle-length-stepper-increment'));
    await fireEvent.press(screen.getByTestId('duration-stepper-decrement'));
    expect(onChangeCycleLength).toHaveBeenCalledWith(5);
    expect(onChangeDuration).toHaveBeenCalledWith(29);
  });

  it('will not go below a 1-day cycle, nor make the challenge shorter than its cycle', async () => {
    const { screen, onChangeCycleLength, onChangeDuration } = await renderCard(1, 1);

    await fireEvent.press(screen.getByTestId('cycle-length-stepper-decrement'));
    await fireEvent.press(screen.getByTestId('duration-stepper-decrement'));
    expect(onChangeCycleLength).not.toHaveBeenCalled();
    expect(onChangeDuration).not.toHaveBeenCalled();
  });
});
