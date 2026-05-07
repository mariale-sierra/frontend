import { StyleSheet, View } from 'react-native';
import { ActivityIcon } from '../icons/activityIcon';
import { Text } from './text';
import { colors, radius, spacing, type ActivityType } from '../../constants/theme';

interface ActivityBadgeProps {
  label: string;
  activityType: ActivityType;
}

export function ActivityBadge({ label, activityType }: ActivityBadgeProps) {
  return (
    <View style={styles.badge}>
      <ActivityIcon type={activityType} size="sm" variant="plain" />
      <Text variant="body" style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
