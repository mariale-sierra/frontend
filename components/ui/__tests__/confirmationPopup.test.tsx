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
        // The popups' black glass: the blur tinted with `ink`, not `surface`.
        expect(tree).toContain(`"backgroundColor":"${withAlpha(colors.ink, glass.blackTintOpacity)}"`);
        // Not a solid `surface` card any more.
        expect(tree).not.toContain(`"backgroundColor":"${colors.surface}"`);
        // The old glow was an SVG radial gradient in the tone's color.
        expect(tree).not.toContain('RadialGradient');
        expect(tree).not.toContain('popupGlow');
        await screen.unmount();
      }
    });

    it('draws its icon in `paper`, like its text — never a status color, whatever the tone or iconColor', async () => {
      const screen = await renderPopup({ tone: 'success', iconColor: colors.error });
      const tree = JSON.stringify(screen.toJSON());

      expect(tree).toContain(`"color":"${colors.paper}"`);
      expect(tree).not.toContain(`"color":"${colors.success}"`);
      expect(tree).not.toContain(`"color":"${colors.error}"`);
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

    it('is sized like an alert with room around its content: at most 320 wide, 32 of padding', async () => {
      const screen = await renderPopup();
      const tree = JSON.stringify(screen.toJSON());

      expect(tree).toContain('"width":"100%","maxWidth":320');
      expect(tree).toContain(`"borderRadius":${radius.xl},"padding":${spacing.xl}`);
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

    it('blurs what is behind it and darkens it a bit more than the sheets do', async () => {
      const screen = await renderPopup();
      const tree = JSON.stringify(screen.toJSON());

      expect(tree).toContain(`"intensity":${glass.popup.backdropBlurIntensity}`);
      expect(tree).toContain(`"backgroundColor":"${withAlpha(colors.ink, glass.popup.backdropDimOpacity)}"`);
      expect(glass.popup.backdropDimOpacity).toBeGreaterThan(fillOpacity.dim);
    });
  });
});

