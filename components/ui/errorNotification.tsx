import { useEffect } from 'react';
import { Animated, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { GlassSurface } from './glassSurface';
import { Text } from './text';
import { Icon } from './icon';

export type NotificationVariant = 'error' | 'success';

type IconName = React.ComponentProps<typeof Icon>['name'];

// Off-screen resting position for the slide-in animation, in raw pixels
// rather than a spacing-scale value — this isn't a gap/padding concept,
// just "far enough above the visible area to be fully hidden."
const HIDDEN_OFFSET_Y = -100;

export interface ErrorNotificationConfig {
  message: string;
  title?: string;
  duration?: number; // ms, 0 = no auto-dismiss
  /** 'error' (default) or 'success' — shown as a small status icon, not a color fill. */
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

// The status shows in ONE small place: the leading icon. The toast itself is the
// same frosted-glass surface as the nav bar and the toggles, with `paper` text —
// the usual toast: quiet, readable, and it says what happened without shouting
// (it used to be a whole banner filled with `error` red / `success` green, which
// was far too loud for something that appears over whatever you were doing).
const STATUS: Record<NotificationVariant, { icon: IconName; color: string }> = {
  error: { icon: 'alert-circle-outline', color: colors.error },
  success: { icon: 'checkmark-circle-outline', color: colors.success },
};

const STATUS_ICON_SIZE = 22;
const DISMISS_ICON_SIZE = 18;

export function ErrorNotification({
  visible,
  config,
  onDismiss,
}: ErrorNotificationProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = new Animated.Value(visible ? 0 : HIDDEN_OFFSET_Y);
  const status = STATUS[config.variant ?? 'error'];

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
        <GlassSurface style={styles.content}>
          <Icon name={status.icon} size={STATUS_ICON_SIZE} color={status.color} />

          <View style={styles.textContainer}>
            {/* `Text`'s own `weight` prop (not a bare `fontWeight`, which does
                nothing on DM Sans — each weight is its own font family). */}
            {config.title && (
              <Text variant="label" weight="bold">
                {config.title}
              </Text>
            )}
            <Text variant="label" tone={config.title ? 'secondary' : 'primary'} numberOfLines={3}>
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
                <Text variant="label" weight="bold">
                  {config.action.label}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={onDismiss}
              hitSlop={spacing.sm}
            >
              <Icon
                name="close-outline"
                size={DISMISS_ICON_SIZE}
                color={withAlpha(colors.paper, textOpacity.secondary)}
              />
            </Pressable>
          </View>
        </GlassSurface>
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
  // `radius.xl` — the toast's own rounder tier (see the token's doc comment).
  // `GlassSurface` supplies the blur, tint, hairline rim and `overflow: hidden`.
  content: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
