import { useEffect } from 'react';
import { Animated, View, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../constants/theme';
import { Text } from './text';
import { Icon } from './icon';

export type NotificationVariant = 'error' | 'success';

// Off-screen resting position for the slide-in animation, in raw pixels
// rather than a spacing-scale value — this isn't a gap/padding concept,
// just "far enough above the visible area to be fully hidden," pre-existing
// and unrelated to this pass's gradient work. Named here (was inline in two
// places) per explicit "check for no hardcoded stuff" request.
const HIDDEN_OFFSET_Y = -100;

export interface ErrorNotificationConfig {
  message: string;
  title?: string;
  duration?: number; // ms, 0 = no auto-dismiss
  /** 'error' (red, default) or 'success' (green) */
  variant?: NotificationVariant;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ErrorNotificationProps {
  visible: boolean;
  config: ErrorNotificationConfig;
  onDismiss: () => void;
}

// Base fill IS the actual status color (`error` red / `success` green) —
// unlike `ConfirmationPopup`'s dark-card-plus-glow treatment from the same
// redesign pass, per explicit follow-up: "I'd rather them go from light to
// the actual status color, instead of them going to almost black." A toast
// still needs to read as "red = something's wrong" / "green = it worked" at
// a glance, which a mostly-dark card with just a tinted highlight doesn't
// do as instantly as the popup's own more contemplative moment can afford.
const STATUS_COLOR: Record<NotificationVariant, string> = {
  error: colors.error,
  success: colors.success,
};

// Tunable highlight parameters, named rather than left as inline magic
// numbers — per explicit "check for no hardcoded stuff" request. Same
// per-component "art direction knob" category as `ChallengeAccentGlow`'s
// own local constants, not a shared design token — nothing else reuses
// this exact shape. Confirmed good as-is ("toasts are great now!"); not
// touched by the same follow-up that adjusted PopupGlow's own constants.
const TOAST_HIGHLIGHT_RADIUS = '110%';
const TOAST_HIGHLIGHT_PEAK_OPACITY = 0.22;

/** A soft light highlight over the solid status-color base — NOT the same
 * "dark base + colored glow" shape `ConfirmationPopup`'s `PopupGlow` uses.
 * `colors.paper` fading from a low peak opacity to fully transparent reads
 * as "light bleeding into the real color," which is what was asked for;
 * kept deliberately subtle (a lower peak opacity than `PopupGlow`'s own)
 * per the explicit "way more subtle" follow-up. */
function ToastHighlight() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="toastHighlight" cx="25%" cy="0%" r={TOAST_HIGHLIGHT_RADIUS}>
            <Stop offset="0%" stopColor={colors.paper} stopOpacity={TOAST_HIGHLIGHT_PEAK_OPACITY} />
            <Stop offset="100%" stopColor={colors.paper} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#toastHighlight)" />
      </Svg>
    </View>
  );
}

export function ErrorNotification({
  visible,
  config,
  onDismiss,
}: ErrorNotificationProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = new Animated.Value(visible ? 0 : HIDDEN_OFFSET_Y);
  const statusColor = STATUS_COLOR[config.variant ?? 'error'];

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : HIDDEN_OFFSET_Y,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    if (visible && config.duration && config.duration > 0) {
      const timeout = setTimeout(onDismiss, config.duration);
      return () => clearTimeout(timeout);
    }
  }, [visible, config.duration, onDismiss]);

  if (!visible && config.duration !== 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          top: insets.top + spacing.md,
        },
      ]}
    >
      <Pressable
        onPress={onDismiss}
        style={styles.touchable}
      >
        <View style={[styles.content, { backgroundColor: statusColor }]}>
          <ToastHighlight />
          <View style={styles.textContainer}>
            {/* `title`/`message` used to carry a raw inline
                `fontWeight: '600'` (title) or no weight at all (message) —
                a real bug, not just a style choice: DM Sans ships each
                weight as its OWN font family file (see Text's own doc
                comment), so a bare `fontWeight` override with no matching
                `fontFamily` silently does nothing — the variant's default
                weight always won regardless. Very likely why "the weight
                in the labels gets lost quickly" — it was never actually
                rendering bold. Fixed by using `Text`'s real `weight` prop,
                which sets both together.
                `tone="inverse"` (ink text) on both — the base is the actual
                bright status color again (see `STATUS_COLOR`'s own doc
                comment), not the dark `ink` card the popup uses, so ink
                text reads better here than `paper` would. */}
            {config.title && (
              <Text variant="body" weight="bold" tone="inverse">
                {config.title}
              </Text>
            )}
            {/* `bold`, not `medium` — per explicit "text weight a bit more"
                follow-up. `bold` (700) is the top of the weight scale (see
                `typography.fontWeight` in theme.ts) — title and message are
                both at the maximum now, which is fine for text this short. */}
            <Text variant="body" weight="bold" tone="inverse" numberOfLines={3}>
              {config.message}
            </Text>
          </View>

          <View style={styles.actions}>
            {config.action && (
              <Pressable
                onPress={config.action.onPress}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <Text variant="body" weight="bold" tone="inverse">
                  {config.action.label}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={onDismiss}
              hitSlop={spacing.sm}
            >
              {/* `ink`, not `primary` — was fine against the old flat
                  error/success fills, but doesn't hold up as well against
                  the real status colors now that the base IS that color
                  again (see `STATUS_COLOR`'s own doc comment); matches the
                  `tone="inverse"` text right next to it. */}
              <Icon name="close-outline" size={20} color={colors.ink} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  touchable: {
    flex: 1,
  },
  // `radius.xl` (40, new 2026-08-30) — was `radius.medium` (16). Same "too
  // square" fix and the same new token `ConfirmationPopup` picked up in
  // this same pass; see that token's own doc comment in theme.ts.
  content: {
    // backgroundColor set inline — the status color, see STATUS_COLOR above.
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.small,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
});
