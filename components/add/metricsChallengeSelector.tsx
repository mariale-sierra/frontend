import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';
import type { ChallengeOption } from '../../types/metrics';

interface MetricsChallengeSelectorProps {
  challenges: ChallengeOption[];
  selectedChallengeId: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (challengeId: string) => void;
}

export function MetricsChallengeSelector({
  challenges,
  selectedChallengeId,
  isOpen,
  onToggle,
  onSelect,
}: MetricsChallengeSelectorProps) {
  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedChallengeId) ?? challenges[0];

  return (
    <View style={styles.container}>
      <Pressable style={({ pressed }) => [styles.trigger, pressed && styles.pressed]} onPress={onToggle}>
        <Text variant="body" style={styles.challengeLabel}>
          {(selectedChallenge?.label ?? 'placeholder').toUpperCase()}
        </Text>

        <View style={styles.chevronButton}>
          <Icon
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textPrimary}
          />
        </View>
      </Pressable>

      {isOpen && (
        <View style={styles.menu}>
          {challenges.map((challenge, index) => {
            const isSelected = challenge.id === selectedChallengeId;
            const isLast = index === challenges.length - 1;

            return (
              <Pressable
                key={challenge.id}
                onPress={() => onSelect(challenge.id)}
                style={({ pressed }) => [
                  styles.option,
                  !isLast && styles.optionDivider,
                  isSelected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="body" style={styles.optionLabel}>
                  {challenge.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  challengeLabel: {
    maxWidth: 180,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '400',
  },
  chevronButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  optionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.surfaceHighlight,
  },
  optionLabel: {
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.88,
  },
});
