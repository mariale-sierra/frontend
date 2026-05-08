import { StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';

interface DayLabelProps {
  label: string;
}

export function DayLabel({ label }: DayLabelProps) {
  return (
    <View style={styles.container}>
      <Text variant="caption" style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
  },
  text: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});

