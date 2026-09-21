import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { ErrorNotification } from '../errorNotification';
import type { ErrorNotificationConfig } from '../errorNotification';
import { colors, lineHeight, radius, spacing } from '../../../constants/theme';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

function renderToast(config: ErrorNotificationConfig, onDismiss = jest.fn()) {
  return renderWithProviders(<ErrorNotification visible config={config} onDismiss={onDismiss} />);
}

describe('ErrorNotification', () => {
  it('shows the message, and a title above it when there is one', async () => {
    const screen = await renderToast({ title: 'Could not save', message: 'Check your connection.', duration: 0 });

    expect(screen.getByText('Could not save')).toBeTruthy();
    expect(screen.getByText('Check your connection.')).toBeTruthy();
  });

  it('dismisses when tapped', async () => {
    const onDismiss = jest.fn();
    const screen = await renderToast({ message: 'Something went wrong', duration: 0 }, onDismiss);

    await fireEvent.press(screen.getByText('Something went wrong'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('runs its action when the action is pressed', async () => {
    const onPress = jest.fn();
    const screen = await renderToast({ message: 'Could not send', duration: 0, action: { label: 'Retry', onPress } });

    await fireEvent.press(screen.getByText('Retry'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // The toast is the same frosted glass as the nav bar and the toggles, and the
  // status is a small icon — it used to be a whole banner filled with red / green.
  describe('look', () => {
    it.each([
      ['error', 'alert-circle-outline', colors.error],
      ['success', 'checkmark-circle-outline', colors.success],
    ] as const)('shows the %s status as a small icon in its own color', async (variant, icon, color) => {
      const screen = await renderToast({ message: 'Message', variant, duration: 0 });
      const tree = JSON.stringify(screen.toJSON());

      expect(tree).toMatch(new RegExp(`"name":"${icon}","size":22,"color":"${color}"`));
    });

    it('is not filled with the status color, and its text is paper, not ink', async () => {
      for (const [variant, color] of [['error', colors.error], ['success', colors.success]] as const) {
        const screen = await renderToast({ message: 'Message', variant, duration: 0 });
        const tree = JSON.stringify(screen.toJSON());

        expect(tree).not.toContain(`"backgroundColor":"${color}"`);
        expect(tree).not.toContain(`"color":"${colors.ink}"`);
        await screen.unmount();
      }
    });

    it('sits on the shared glass surface — a blur and the surface tint', async () => {
      const screen = await renderToast({ message: 'Message', duration: 0 });
      const tree = JSON.stringify(screen.toJSON());

      expect(tree).toContain('ExpoBlur');
      expect(tree).toContain(colors.surface);
    });

    it('has the light of a popup — a sheen and a gradient rim, following its radius — not a flat dark bar', async () => {
      for (const variant of ['error', 'success'] as const) {
        const screen = await renderToast({ message: 'Message', variant, duration: 0 });
        const tree = JSON.stringify(screen.toJSON());

        expect(tree).toContain('glassSheen');
        expect(tree).toContain('glassRim');
        expect(tree).toContain(`"rx":${radius.medium},"ry":${radius.medium}`);
        await screen.unmount();
      }
    });

    // It was `radius.xl` (40): on a bar about 46 tall, a full pill ("too rounded"), whose rim was
    // stretched into an ellipse.
    it('is a rounded bar, not a pill: the medium radius', async () => {
      const screen = await renderToast({ message: 'Message', duration: 0 });
      const tree = JSON.stringify(screen.toJSON());

      expect(tree).toContain(`"borderRadius":${radius.medium}`);
      expect(tree).not.toContain(`"borderRadius":${radius.xl}`);
    });

    it('has a radius its bar can carry: no more than half of the shortest it gets', async () => {
      // A single line of text, or the status icon, between its vertical padding.
      const shortest = spacing.md * 2 + Math.max(lineHeight.sm, 22);

      expect(radius.medium).toBeLessThanOrEqual(shortest / 2);
    });
  });
});
