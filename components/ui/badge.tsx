import { View, StyleSheet, ViewProps } from 'react-native';
import { Text } from './text';
import { colors, spacing, radius, ActivityType } from '../../constants/theme';

type BadgeVariant = 'default' | 'minimal' | 'activity';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
  activityType?: ActivityType;
}

export function Badge({
  label,
  variant = 'default',
  activityType,
  style,
  ...props
}: BadgeProps) {
  const activityColor =
    activityType && colors.activityType[activityType];

  const backgroundColor =
    variant === 'activity' && activityColor
      ? `${activityColor}20` // 🔥 dark transparent background
      : variant === 'default'
      ? colors.background
      : 'transparent';

  const borderColor =
    variant === 'activity' && activityColor
      ? activityColor
      : variant === 'default'
      ? colors.textPrimary
      : 'transparent';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor,
        },
        variant !== 'minimal' && styles.withBorder,
        style,
      ]}
      {...props}
    >
      <Text variant="activity" activity={activityType} style={styles.badgeText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },

  withBorder: {
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 12,
    lineHeight: 14,
  },
});