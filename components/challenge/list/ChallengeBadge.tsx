import { StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';

interface ChallengeBadgeProps {
  label: string;
}

export function ChallengeBadge({ label }: ChallengeBadgeProps) {
  return (
    <View style={styles.container}>
      <Text variant="caption" style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

