import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme as render } from '../../../test-utils/renderWithTheme';
import { AccentPill } from '../accentPill';
import { activityColors } from '../../../constants/theme';

describe('AccentPill', () => {
  it('shows its label', async () => {
    const screen = await render(<AccentPill label="Join" color={activityColors.strength} />);
    expect(screen.getByText('Join')).toBeTruthy();
  });

  it('fills itself with the accent color', async () => {
    const screen = await render(<AccentPill label="Join" color={activityColors.strength} onPress={jest.fn()} />);
    expect(StyleSheet.flatten(screen.getByRole('button').props.style)).toMatchObject({
      backgroundColor: activityColors.strength,
    });
  });

  it('is only a button when it has an onPress, so it can sit inside a pressable card', async () => {
    const plain = await render(<AccentPill label="View" color={activityColors.strength} />);
    expect(plain.queryByRole('button')).toBeNull();
    await plain.unmount();

    const onPress = jest.fn();
    const pressable = await render(<AccentPill label="Join" color={activityColors.strength} onPress={onPress} />);
    await fireEvent.press(pressable.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner instead of the label and blocks presses while loading', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <AccentPill label="Join" color={activityColors.strength} onPress={onPress} loading />,
    );
    expect(screen.queryByText('Join')).toBeNull();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a leading icon and sets the label in capitals when asked (the compact badge)', async () => {
    const screen = await render(
      <AccentPill size="sm" uppercase icon="flash-outline" label="Cardio low" color={activityColors.cardioLow} />,
    );

    expect(screen.getByText('Cardio low')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByText('Cardio low').props.style)).toMatchObject({
      textTransform: 'uppercase',
    });
  });

  it('is smaller in the compact size', async () => {
    const regular = await render(<AccentPill label="Join" color={activityColors.strength} />);
    expect(JSON.stringify(regular.toJSON())).toContain('"minHeight":32');
    await regular.unmount();

    const compact = await render(<AccentPill size="sm" label="Join" color={activityColors.strength} />);
    expect(JSON.stringify(compact.toJSON())).not.toContain('"minHeight":32');
  });

  it('renders the outline variant without an accent fill', async () => {
    const screen = await render(<AccentPill variant="outline" label="Pending" />);
    expect(screen.getByText('Pending')).toBeTruthy();
  });
});
