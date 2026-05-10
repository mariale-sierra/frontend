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
      <ActivityIcon type={activityType} size="sm" variant="circle-glow" />
      <Text variant="body" style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  label: {
    color: colors.textPrimary,
  },
});
