import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { IconButton } from '../ui/iconButton';
import { Button } from '../ui/button';
import { colors, spacing } from '../../constants/theme';

interface DayRoutineHeaderProps {
  title: string;
  onBack: () => void;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
  rightActionDisabled?: boolean;
  rightActionLoading?: boolean;
}

export function DayRoutineHeader({
  title,
  onBack,
  rightActionLabel,
  onRightActionPress,
  rightActionDisabled = false,
  rightActionLoading = false,
}: DayRoutineHeaderProps) {
  const showRightAction = Boolean(rightActionLabel && onRightActionPress);

  return (
    <View style={styles.header}>
      <IconButton
        name="chevron-back"
        onPress={onBack}
        size={32}
        iconSize={24}
        iconColor={colors.textPrimary}
        variant="ghost"
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        pressedOpacity={0.82}
      />

      <Text variant="subheader" style={styles.headerTitle} >
        {title}
      </Text>

      {showRightAction ? (
        <Button
          size="sm"
          variant="primary"
          onPress={onRightActionPress}
          disabled={rightActionDisabled}
          loading={rightActionLoading}
          style={styles.rightActionButton}
        >
          {rightActionLabel as string}
        </Button>
      ) : (
        <View style={styles.trailingSpacer} />
      )}
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
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 1.8,
  },
  trailingSpacer: {
    width: 32,
    height: 32,
  },
  rightActionButton: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },
});
