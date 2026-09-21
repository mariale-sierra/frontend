import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { Button } from './button';
import { glassBorderStyle } from './glassSurface';
import { Icon } from './icon';
import { Text } from './text';

export interface ConfirmationButtonConfig {
  label: string;
  onPress: () => void | Promise<void>;
  /** `neutral` (solid `ink`) is the default secondary/cancel treatment — no
   * `outline` (bordered/transparent) buttons in a popup, ever. */
  variant?: 'primary' | 'danger' | 'neutral';
  loading?: boolean;
  disabled?: boolean;
}

type PopupIconName = React.ComponentProps<typeof Icon>['name'];

interface ConfirmationPopupProps {
  visible: boolean;
  title: string;
  description?: string;
  primaryButton: ConfirmationButtonConfig;
  secondaryButton?: ConfirmationButtonConfig;
  onDismiss?: () => void;
  /** `success` makes the icon `success`-green instead of the neutral `primary`
   * — the only place the tone shows. The card is the same plain `surface` for
   * both. */
  tone?: 'default' | 'success';
  /** Optional icon shown centered above the title. Per explicit "make them
   * pop, once in a while" request — deliberately NOT added to every call
   * site mechanically; most popups still have none, and that's fine. */
  icon?: PopupIconName;
  /** Overrides the icon's default color (the tone's own). */
  iconColor?: string;
}

// The tone shows in the icon and nowhere else. The card used to carry a radial
// glow in the tone's color (neutral, or `success` green) behind everything, which
// was far too loud for a confirmation — a standard popup is a plain elevated card
// with a title, a line of text and its buttons, and a status color, if any, on a
// small icon. So: a `surface` card with the shared hairline rim, over the dimmed
// backdrop.
const ICON_COLOR = {
  default: colors.primary,
  success: colors.success,
} as const;

const ICON_SIZE = 40;

// Not on the `spacing` scale on purpose — a minimum WIDTH constraint so a
// short label ("OK") doesn't render a visibly narrower button next to a
// longer one in the same row, not a gap/padding value. Same "per-component
// sizing constant" category as `FAB_SIZE`/`AVATAR_SIZE` elsewhere.
const ACTION_BUTTON_MIN_WIDTH = 110;

export function ConfirmationPopup({
  visible,
  title,
  description,
  primaryButton,
  secondaryButton,
  onDismiss,
  tone = 'default',
  icon,
  iconColor,
}: ConfirmationPopupProps) {
  const handleBackdropPress = () => {
    if (!primaryButton.loading && !secondaryButton?.loading) {
      onDismiss?.();
    }
  };

  const isPrimaryDisabled = !!(
    primaryButton.disabled || primaryButton.loading || secondaryButton?.loading
  );
  const isSecondaryDisabled = !!(
    secondaryButton?.disabled || secondaryButton?.loading || primaryButton.loading
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleBackdropPress}
        disabled={!!(primaryButton.loading || secondaryButton?.loading)}
      >
        {/* Two layers, not one: `shadows.lg` needs `overflow: visible` to
            actually render (iOS clips a shadow the same as any other
            content once its view has `overflow: hidden`), while the card
            keeps its own fill and rim inside the rounded corners. */}
        <Pressable style={styles.cardShadowWrap}>
          <View style={styles.card}>
            <Stack gap="lg" align="center">
              {/* Icon-to-title gap is deliberately its OWN, smaller `Stack`
                  (`md`, 12) nested inside the outer one (`lg`, 24) — per
                  explicit "the gap between icon and content feels too big"
                  follow-up. A single `Stack` can only apply one uniform
                  gap to every child, so shrinking just this one pairing
                  (without also shrinking the larger gap down to the button
                  row, which wasn't part of the complaint) needs this split
                  rather than one shared gap value. */}
              <Stack gap="md" align="center">
                {icon && <Icon name={icon} size={ICON_SIZE} color={iconColor ?? ICON_COLOR[tone]} />}
                <Stack gap="sm" align="center" style={styles.textContent}>
                  <Text variant="title" align="center">
                    {title}
                  </Text>
                  {description && (
                    <Text variant="body" tone="secondary" align="center">
                      {description}
                    </Text>
                  )}
                </Stack>
              </Stack>

              <Row justify="center" gap="md">
                {secondaryButton && (
                  <Button
                    variant={secondaryButton.variant ?? 'neutral'}
                    size="md"
                    loading={secondaryButton.loading}
                    disabled={isSecondaryDisabled}
                    onPress={() => secondaryButton.onPress()}
                    style={styles.actionButton}
                  >
                    {secondaryButton.label}
                  </Button>
                )}
                <Button
                  variant={primaryButton.variant ?? 'primary'}
                  size="md"
                  loading={primaryButton.loading}
                  disabled={isPrimaryDisabled}
                  onPress={() => primaryButton.onPress()}
                  style={styles.actionButton}
                >
                  {primaryButton.label}
                </Button>
              </Row>
            </Stack>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: withAlpha(colors.ink, 0.75),
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardShadowWrap: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    ...shadows.lg,
  },
  // `radius.xl` (40, new 2026-08-30) — was `radius.big` (28), the scale's
  // previous top tier and the standard "hero card" radius used everywhere
  // else (nav bar, primary buttons, hero cards) — bumped specifically here
  // per explicit "too square" feedback, see the token's own doc comment in
  // theme.ts for why a new tier, not a `big` value change.
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...glassBorderStyle,
  },
  actionButton: {
    minWidth: ACTION_BUTTON_MIN_WIDTH,
  },
  textContent: {
    paddingTop: spacing.sm,
  },
});
