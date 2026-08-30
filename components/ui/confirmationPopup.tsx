import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { Button } from './button';
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
  /** `success` tints the card's glow `success`-green instead of the default
   * neutral `primary` tint — both are the same dark-card-with-a-glow
   * shape now (see the 2026-08-30 redesign note below), not two visually
   * distinct card treatments the way `success` used to be (a flat solid
   * green fill). */
  tone?: 'default' | 'success';
  /** Optional icon shown centered above the title. Per explicit "make them
   * pop, once in a while" request — deliberately NOT added to every call
   * site mechanically; most popups still have none, and that's fine. */
  icon?: PopupIconName;
  /** Overrides the icon's default color (the tone's own glow color). */
  iconColor?: string;
}

// Tone → the glow's own tint. Was `success` = a flat solid `colors.success`
// card fill with `ink` (dark) text — replaced 2026-08-30, per explicit
// "the gray feels too flat/meh, lacks depth" request (which named the
// default tone, but the old success treatment had the exact same flatness
// problem from the other direction — a flat block instead of anything with
// depth). Both tones are now the same dark `ink` card with a radial glow in
// the tone's own color, so `paper` (light) text works for both — no more
// per-tone text-color branching anywhere in this component.
const GLOW_COLOR = {
  default: colors.primary,
  success: colors.success,
} as const;

// Tunable glow parameters, named rather than left as inline magic numbers —
// per explicit "check for no hardcoded stuff" request. These aren't shared
// design tokens (no other component reuses this exact shape, same as
// ChallengeAccentGlow's own local `widenFactor`/`r` constants) — they're
// this one glow's own art-direction knobs, named so a future "make it
// softer/bigger" request (like the two rounds that already happened) is a
// one-line change instead of hunting through JSX for a bare number.
// Revision history: r 90%→160% (2026-08-30, "too dark at the bottom"),
// r 160%→220% + both stop opacities lowered (2026-08-30, "softer" + "bigger
// radius" follow-up, same day — color mix itself explicitly kept as-is).
const POPUP_GLOW_RADIUS = '220%';
const POPUP_GLOW_PEAK_OPACITY = 0.22;
const POPUP_GLOW_MID_OPACITY = 0.08;

// Not on the `spacing` scale on purpose — a minimum WIDTH constraint so a
// short label ("OK") doesn't render a visibly narrower button next to a
// longer one in the same row, not a gap/padding value. Same "per-component
// sizing constant" category as `FAB_SIZE`/`AVATAR_SIZE` elsewhere.
const ACTION_BUTTON_MIN_WIDTH = 110;

/**
 * The card's own soft top-down glow — same `react-native-svg` `RadialGradient`
 * mechanism `ScreenBackground`/`ChallengeAccentGlow` already use (the one
 * approved gradient technique in this app; never `expo-linear-gradient`,
 * removed elsewhere on purpose — see design system → Explicitly Rejected
 * Patterns). New exception for this component specifically, per explicit
 * "a gradient would look nice, a darker look" request — not a general
 * license to add gradients elsewhere without asking first.
 */
function PopupGlow({ color }: { color: string }) {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="popupGlow" cx="50%" cy="0%" r={POPUP_GLOW_RADIUS}>
            <Stop offset="0%" stopColor={color} stopOpacity={POPUP_GLOW_PEAK_OPACITY} />
            <Stop offset="55%" stopColor={color} stopOpacity={POPUP_GLOW_MID_OPACITY} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#popupGlow)" />
      </Svg>
    </View>
  );
}

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
  const glowColor = GLOW_COLOR[tone];
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
            content once its view has `overflow: hidden`), but the glow
            below needs `overflow: hidden` to stay inside the rounded
            corners instead of painting a visible square behind them. Same
            "outer shadow wrapper + inner clipped fill" split `Card`'s own
            glass/glow variants already use for the identical reason. */}
        <Pressable style={styles.cardShadowWrap}>
          <View style={styles.card}>
            <PopupGlow color={glowColor} />
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
                {icon && <Icon name={icon} size={40} color={iconColor ?? glowColor} />}
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
    backgroundColor: colors.ink,
    overflow: 'hidden',
  },
  actionButton: {
    minWidth: ACTION_BUTTON_MIN_WIDTH,
  },
  textContent: {
    paddingTop: spacing.sm,
  },
});
