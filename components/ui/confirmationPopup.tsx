import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, glass, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Stack } from '../layout/stack';
import { Button } from './button';
import { GlassSurface } from './glassSurface';
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
  /** @deprecated Popups no longer color their icon (2026-10-08, explicit
   * request: icons in the same `paper` white as the popup's text). Kept so
   * existing call sites compile; it has no visible effect. */
  tone?: 'default' | 'success';
  /** Optional icon shown centered above the title. Per explicit "make them
   * pop, once in a while" request — deliberately NOT added to every call
   * site mechanically; most popups still have none, and that's fine. */
  icon?: PopupIconName;
  /** @deprecated Same as `tone`: the icon is always `paper`. Kept for call-site
   * compatibility; ignored. */
  iconColor?: string;
  /** Optional decorative content drawn over the whole modal (backdrop AND
   * card), e.g. a confetti burst — `ChallengeFinishedPopup`'s own doc
   * comment. Rendered inside the same `Modal`, since RN's `Modal` is its own
   * native layer — a sibling outside `ConfirmationPopup` would render
   * behind it, not on top. Must be non-interactive on its own (this popup
   * doesn't add `pointerEvents` around it) so it never blocks the buttons.
   * Nothing passes this today except that one popup — every other call site
   * is unaffected. */
  overlay?: ReactNode;
}

// No status color anywhere: the card used to carry a radial glow in the tone's
// color behind everything (far too loud for a confirmation), and then the tone
// lived on the icon alone — until 2026-10-08, when the icon too went to the same
// `paper` white as the popup's text (explicit request). What a popup means is in
// its words and its buttons (a `danger` button stays red). So: a
// frosted-glass card (the blur and tint of the nav bar and the comments sheet, plus
// the light of a popup: a `paper` sheen and a gradient rim) over the dimmed
// backdrop, so what is behind the popup shows through it. (It was a plain solid
// `surface` card with a hairline: bland.)
const ICON_COLOR = colors.paper;

// The popup is sized like a standard alert (iOS's is 270 wide, Material's smallest 280):
// it was 360 wide with 32px padding and a 30px title (`title`), which read as a
// whole card, not a popup. Then 300 wide with 24px padding; since 2026-10-08
// (explicit "more padding between the content and the card, so the card looks a bit
// bigger") 320 wide with 32px padding — the content keeps about the same width, the
// card around it grows. A `subheader` title, a 14px description and a 32px icon.
const ICON_SIZE = 32;

// Not on the `spacing` scale on purpose — a WIDTH cap, like a per-component sizing
// constant (`FAB_SIZE`/`AVATAR_SIZE` elsewhere), not a gap/padding value.
const POPUP_MAX_WIDTH = 320;


export function ConfirmationPopup({
  visible,
  title,
  description,
  primaryButton,
  secondaryButton,
  onDismiss,
  icon,
  overlay,
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
        {/* The screen behind goes out of focus and a bit darker, so the popup
            is clearly the one thing to look at (`glass.popup`). */}
        <BlurView
          intensity={glass.popup.backdropBlurIntensity}
          tint="dark"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.backdropDim} pointerEvents="none" />
        {/* The wrapper takes the taps on the card, so they don't reach the
            backdrop and dismiss the popup. (No shadow: a see-through card
            can't cast one, and the glass rim does the lifting.) */}
        <Pressable style={styles.cardWrap}>
          <GlassSurface highlight variant="popup" style={styles.card}>
            {/* `xl` between the message and the buttons — raised twice on
                explicit request (2026-10-08): `base` → `lg` → `xl`. */}
            <Stack gap="xl" align="center">
              {/* Icon-to-title gap is deliberately its OWN, smaller `Stack`
                  (`md`, 12) nested inside the outer one (`base`, 16) — per
                  explicit "the gap between icon and content feels too big"
                  follow-up. A single `Stack` can only apply one uniform
                  gap to every child, so shrinking just this one pairing
                  (without also shrinking the larger gap down to the button
                  row, which wasn't part of the complaint) needs this split
                  rather than one shared gap value. */}
              <Stack gap="md" align="center">
                {icon && <Icon name={icon} size={ICON_SIZE} color={ICON_COLOR} />}
                <Stack gap="xs" align="center">
                  <Text variant="subheader" align="center">
                    {title}
                  </Text>
                  {description && (
                    <Text variant="body" size="sm" tone="secondary" align="center">
                      {description}
                    </Text>
                  )}
                </Stack>
              </Stack>

              {/* Full width and stacked: the main action on top, the way out
                  under it. `md` (44 tall) with a bold label, not the screens'
                  52-tall `cta` — inside a small card that read as too tall
                  (explicit request, 2026-10-08). A
                  "neutral" secondary renders as `subtle` (translucent) here —
                  two solid white pills read as the same button. */}
              <Stack gap="sm" style={styles.actions}>
                <Button
                  variant={primaryButton.variant ?? 'primary'}
                  size="md"
                  textWeight="bold"
                  loading={primaryButton.loading}
                  disabled={isPrimaryDisabled}
                  onPress={() => primaryButton.onPress()}
                >
                  {primaryButton.label}
                </Button>
                {secondaryButton && (
                  <Button
                    variant={
                      !secondaryButton.variant || secondaryButton.variant === 'neutral'
                        ? 'subtle'
                        : secondaryButton.variant
                    }
                    size="md"
                    textWeight="bold"
                    loading={secondaryButton.loading}
                    disabled={isSecondaryDisabled}
                    onPress={() => secondaryButton.onPress()}
                  >
                    {secondaryButton.label}
                  </Button>
                )}
              </Stack>
            </Stack>
          </GlassSurface>
        </Pressable>
      </Pressable>
      {overlay}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // The same dim as the bottom sheets' backdrop: the glass card needs something
  // behind it to show through it, which a near-black .75 dim left nothing of.
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backdropDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha(colors.ink, glass.popup.backdropDimOpacity),
  },
  cardWrap: {
    width: '100%',
    maxWidth: POPUP_MAX_WIDTH,
  },
  // `radius.xl` (40, new 2026-08-30) — was `radius.big` (28), the scale's
  // previous top tier and the standard "hero card" radius used everywhere
  // else (nav bar, primary buttons, hero cards) — bumped specifically here
  // per explicit "too square" feedback, see the token's own doc comment in
  // theme.ts for why a new tier, not a `big` value change.
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  actions: {
    alignSelf: 'stretch',
  },
});
