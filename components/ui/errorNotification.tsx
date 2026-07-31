import { useEffect } from 'react';
import { Animated, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../constants/theme';
import { Text } from './text';
import { MaterialIcons } from '@expo/vector-icons';

export type NotificationVariant = 'error' | 'success';

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

export function ErrorNotification({
  visible,
  config,
  onDismiss,
}: ErrorNotificationProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = new Animated.Value(visible ? 0 : -100);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -100,
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
        <View
          style={[
            styles.content,
            config.variant === 'success' && styles.contentSuccess,
          ]}
        >
          <View style={styles.textContainer}>
            {config.title && (
              <Text
                variant="body"
                tone="inverse"
                style={styles.title}
              >
                {config.title}
              </Text>
            )}
            <Text
              variant="body"
              tone="inverse"
              numberOfLines={3}
            >
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
                <Text variant="body" tone="inverse" style={{ fontWeight: '600' }}>
                  {config.action.label}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={onDismiss}
              hitSlop={spacing.sm}
            >
              <MaterialIcons name="close" size={20} color={colors.primary} />
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
  contentSuccess: {
    backgroundColor: colors.success,
  },
  content: {
    backgroundColor: colors.error,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
});
