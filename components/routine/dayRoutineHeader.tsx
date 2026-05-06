import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { IconButton } from '../ui/iconButton';
import { colors, spacing } from '../../constants/theme';

interface DayRoutineHeaderProps {
  title: string;
  onBack: () => void;
}

export function DayRoutineHeader({ title, onBack }: DayRoutineHeaderProps) {
  return (
    <View style={styles.header}>
      <IconButton
        name="chevron-back"
        onPress={onBack}
        size={32}
        iconSize={24}
        iconColor={colors.textSecondary}
        variant="ghost"
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        pressedOpacity={0.82}
      />

      <Text variant="subheader" style={styles.headerTitle}>
        {title}
      </Text>

      <View style={styles.trailingSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    minHeight: 56,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 1.8,
  },
  trailingSpacer: {
    width: 32,
    height: 32,
  },
});
