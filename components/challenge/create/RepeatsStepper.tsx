import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface RepeatsStepperProps {
  cycleLengthDays: number;
  cyclesCount: number;
  durationDays: number;
  endDateLabel: string;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function RepeatsStepper({ cycleLengthDays, cyclesCount, durationDays, endDateLabel, onIncrement, onDecrement }: RepeatsStepperProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text variant="header" tone="secondary">{t('challengeCreate.duration.repeats')}</Text>

      <View style={styles.card}>
        <Pressable onPress={onDecrement} style={({ pressed }) => [styles.circleButton, styles.circleButtonNeutral, pressed && styles.pressed]}>
          <Icon name="remove-outline" size={20} color={colors.paper} />
        </Pressable>

        <View style={styles.valueBlock}>
          <Text variant="title">{cyclesCount}</Text>
          <Text variant="caption" tone="secondary" style={styles.valueUnit}>{t('challengeCreate.duration.cycles')}</Text>
        </View>

        <Pressable onPress={onIncrement} style={({ pressed }) => [styles.circleButton, styles.circleButtonPrimary, pressed && styles.pressed]}>
          <Icon name="add-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.calloutRow}>
        <Icon name="calendar-outline" size={18} color={colors.secondary} />
        <Text variant="body" style={styles.calloutText}>
          {t('challengeCreate.duration.callout', {
            cycleLengthDays: t('challenges.durationDaysLabel', { count: cycleLengthDays }),
            cyclesCount,
            totalDays: t('challenges.durationDaysLabel', { count: durationDays }),
            endDate: endDateLabel,
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.big,
    padding: spacing.lg,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonNeutral: {
    backgroundColor: withAlpha(colors.paper, 0.1),
  },
  circleButtonPrimary: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  valueBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  valueUnit: {
    letterSpacing: 1.2,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: withAlpha(colors.secondary, 0.1),
    borderRadius: radius.medium,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  calloutText: {
    flex: 1,
  },
});
