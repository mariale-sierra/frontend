import { fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { ConfirmationPopup } from '../confirmationPopup';
import { colors, fillOpacity, fontSize, glass, lineHeight, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

describe('ConfirmationPopup', () => {
  const baseProps = {
    visible: true,
    title: 'Cancel invitation?',
    description: 'This cannot be undone.',
  };

  it('renders title, description and both buttons', async () => {
    const screen = await renderWithTheme(
      <ConfirmationPopup
        {...baseProps}
        primaryButton={{ label: 'Confirm', onPress: jest.fn() }}
        secondaryButton={{ label: 'Back', onPress: jest.fn() }}
      />,
    );

    expect(screen.getByText('Cancel invitation?')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
    expect(screen.getByText('Confirm')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
  });

  it('fires the matching callback for each button', async () => {
    const onConfirm = jest.fn();
    const onBack = jest.fn();
    const screen = await renderWithTheme(
      <ConfirmationPopup
        {...baseProps}
        primaryButton={{ label: 'Confirm', onPress: onConfirm }}
        secondaryButton={{ label: 'Back', onPress: onBack }}
      />,
    );

    await fireEvent.press(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('disables the secondary button while the primary action is loading', async () => {
    const onBack = jest.fn();
    const screen = await renderWithTheme(
      <ConfirmationPopup
        {...baseProps}
        primaryButton={{ label: 'Confirm', onPress: jest.fn(), loading: true }}
        secondaryButton={{ label: 'Back', onPress: onBack }}
      />,
    );

    await fireEvent.press(screen.getByText('Back'));
    expect(onBack).not.toHaveBeenCalled();
  });

  it('renders nothing when not visible', async () => {
    const screen = await renderWithTheme(
      <ConfirmationPopup
        {...baseProps}
        visible={false}
        primaryButton={{ label: 'Confirm', onPress: jest.fn() }}
      />,
    );

    expect(screen.queryByText('Cancel invitation?')).toBeNull();
  });

  // A plain elevated card, not a colored one: the tone used to tint a glow across
  // the whole card, which was far too loud for a confirmation.
  describe('look', () => {
    async function renderPopup(props: Partial<React.ComponentProps<typeof ConfirmationPopup>> = {}) {
      return renderWithTheme(
        <ConfirmationPopup
          {...baseProps}
          icon="checkmark-circle-outline"
          primaryButton={{ label: 'Confirm', onPress: jest.fn() }}
          {...props}
        />,
      );
    }

    it('is a frosted-glass card — the blur and the tint — with no colored glow behind it, whichever the tone', async () => {
      for (const tone of ['default', 'success'] as const) {
        const screen = await renderPopup({ tone });
        const tree = JSON.stringify(screen.toJSON());

        expect(tree).toContain('ExpoBlur');
        expect(tree).toContain(`"backgroundColor":"${withAlpha(colors.surface, glass.tintOpacity)}"`);
        // Not a solid `surface` card any more.
        expect(tree).not.toContain(`"backgroundColor":"${colors.surface}"`);
        // The old glow was an SVG radial gradient in the tone's color.
        expect(tree).not.toContain('RadialGradient');
        expect(tree).not.toContain('popupGlow');
        await screen.unmount();
      }
    });

    it('shows the tone only in the icon: neutral by default, `success` green for the success tone', async () => {
      const neutral = await renderPopup();
      const success = await renderPopup({ tone: 'success' });

      expect(JSON.stringify(neutral.toJSON())).toContain(`"color":"${colors.primary}"`);
      expect(JSON.stringify(success.toJSON())).toContain(`"color":"${colors.success}"`);
      // The success green is on the icon, not on any fill.
      expect(JSON.stringify(success.toJSON())).not.toContain(`"backgroundColor":"${colors.success}`);
    });

    it('lets a caller color the icon itself (a destructive confirmation)', async () => {
      const screen = await renderPopup({ iconColor: colors.error });

      expect(JSON.stringify(screen.toJSON())).toContain(`"color":"${colors.error}"`);
    });

    it('rounds the card, and lights it like glass: a sheen and a gradient rim, in `paper` whichever the tone', async () => {
      for (const tone of ['default', 'success'] as const) {
        const screen = await renderPopup({ tone });
        const tree = JSON.stringify(screen.toJSON());

        expect(tree).toContain('glassSheen');
        expect(tree).toContain('glassRim');
        expect(tree).toContain(`"rx":${radius.xl},"ry":${radius.xl}`);
        await screen.unmount();
      }
    });

    it('is sized like a standard alert, not a whole card: at most 300 wide, 24 of padding', async () => {
      const screen = await renderPopup();
      const tree = JSON.stringify(screen.toJSON());

      expect(tree).toContain('"width":"100%","maxWidth":300');
      expect(tree).toContain(`"borderRadius":${radius.xl},"padding":${spacing.lg}`);
    });

    it('sets its title as a subheader (20), not a screen title (30), and its description at 14', async () => {
      const screen = await renderPopup();
      const tree = JSON.stringify(screen.toJSON());

      expect(tree).toContain(`"fontSize":${fontSize.xl},"lineHeight":${lineHeight.xl}`);
      expect(tree).not.toContain(`"fontSize":${fontSize['3xl']}`);
      expect(tree).toContain(`"fontSize":${fontSize.sm},"lineHeight":${lineHeight.sm}`);
    });

    it('shrinks the icon to 32', async () => {
      const screen = await renderPopup();

      expect(JSON.stringify(screen.toJSON())).toContain('"size":32');
    });

    it('dims what is behind it the way the bottom sheets do, so the glass has something to show', async () => {
      const screen = await renderPopup();

      expect(JSON.stringify(screen.toJSON())).toContain(`"backgroundColor":"${withAlpha(colors.ink, fillOpacity.dim)}"`);
    });
  });
});

