import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme as render } from '../../../test-utils/renderWithTheme';
import { AccentPill } from '../accentPill';
import { activityColors, colors, glass } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

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

  it('renders the surface variant as a plain surface fill — no accent, no outline', async () => {
    const screen = await render(<AccentPill variant="surface" label="Pending" color={activityColors.strength} />);
    const tree = JSON.stringify(screen.toJSON());

    expect(screen.getByText('Pending')).toBeTruthy();
    expect(tree).toContain(`"backgroundColor":"${colors.surface}"`);
    // Not filled with the accent, not outlined.
    expect(tree).not.toContain(`"backgroundColor":"${activityColors.strength}"`);
    expect(tree).not.toContain('"borderWidth"');
  });

  describe('glass variant', () => {
    it('is frosted glass: a blur behind the content and no fill of its own', async () => {
      const screen = await render(<AccentPill variant="glass" label="Gym" color={activityColors.strength} />);
      const tree = JSON.stringify(screen.toJSON());

      expect(screen.getByText('Gym')).toBeTruthy();
      // The blur (an expo-blur view), and no accent fill or plain surface fill under it.
      expect(tree).toContain('ExpoBlur');
      expect(tree).not.toContain(`"backgroundColor":"${activityColors.strength}"`);
    });

    it('is rimmed with the glass hairline, and clips its glass to its own rounded shape', async () => {
      const screen = await render(<AccentPill variant="glass" label="Gym" onPress={jest.fn()} />);
      const style = StyleSheet.flatten(screen.getByRole('button').props.style);

      expect(style.borderWidth).toBe(StyleSheet.hairlineWidth);
      expect(style.overflow).toBe('hidden');
    });

    it('sets its label and its icon in paper, not the ink of a filled pill', async () => {
      const glass = await render(<AccentPill variant="glass" icon="barbell-outline" label="Gym" />);
      expect(StyleSheet.flatten(glass.getByText('Gym').props.style).color).not.toBe(colors.ink);
      expect(JSON.stringify(glass.toJSON())).toContain(`"color":"${colors.paper}"`);
      await glass.unmount();

      const filled = await render(<AccentPill icon="barbell-outline" label="Gym" color={activityColors.strength} />);
      expect(StyleSheet.flatten(filled.getByText('Gym').props.style).color).toBe(colors.ink);
      expect(JSON.stringify(filled.toJSON())).not.toContain('ExpoBlur');
    });

    it('is tinted lighter than the sheets and the nav bar, so a light behind it reads through', async () => {
      const tree = JSON.stringify((await render(<AccentPill variant="glass" label="Gym" />)).toJSON());

      expect(tree).toContain(withAlpha(colors.surface, glass.badgeTintOpacity));
      expect(tree).not.toContain(withAlpha(colors.surface, glass.tintOpacity));
    });

    it('is a button only with an onPress, like the others', async () => {
      const plain = await render(<AccentPill variant="glass" label="Gym" />);
      expect(plain.queryByRole('button')).toBeNull();
    });
  });
});
