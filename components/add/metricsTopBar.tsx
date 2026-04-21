import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../ui/icon';
import { RestDayIconButton } from '../icons/restDayIconButton';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';
import { MetricsChallengeSelector } from './metricsChallengeSelector';
import type { ChallengeOption } from '../../types/metrics';

interface MetricsTopBarProps {
  challenges: ChallengeOption[];
  selectedChallengeId: string;
  isChallengeMenuOpen: boolean;
  onToggleChallengeMenu: () => void;
  onSelectChallenge: (challengeId: string) => void;
  onBack: () => void;
  onRestDay: () => void;
  onSkip: () => void;
}

export function MetricsTopBar({
  challenges,
  selectedChallengeId,
  isChallengeMenuOpen,
  onToggleChallengeMenu,
  onSelectChallenge,
  onBack,
  onRestDay,
  onSkip,
}: MetricsTopBarProps) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Icon name="chevron-back" size={18} />
      </Pressable>

      <MetricsChallengeSelector
        challenges={challenges}
        selectedChallengeId={selectedChallengeId}
        isOpen={isChallengeMenuOpen}
        onToggle={onToggleChallengeMenu}
        onSelect={onSelectChallenge}
      />

      <View style={styles.headerActions}>
        <RestDayIconButton onPress={onRestDay} />

        <Pressable
          onPress={onSkip}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Skip metrics"
        >
          <Text variant="caption" style={styles.actionButtonLabel}>
            Skip
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionButtonLabel: {
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.88,
  },
});
