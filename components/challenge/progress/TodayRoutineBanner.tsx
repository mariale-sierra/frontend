import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';

interface TodayRoutineBannerProps {
  /** Null on a rest day (no routine to show) — see the rest-day branch below. */
  routineName: string | null;
  isRestDay: boolean;
  onPress?: () => void;
}

/**
 * The "Today's routine: {name}" pill from Challenge-Detail-Grid/Calendar —
 * a `primary` Hero CTA card (see Components → Card variants) linking through
 * to the existing Routine-Detail route. Purposefully minimal for the
 * rest-day state (no press, no chevron) — a dedicated wireframe for this
 * component's own states is coming separately per the user; this covers
 * only what the two Challenge-Detail wireframes actually specify.
 */
export function TodayRoutineBanner({ routineName, isRestDay, onPress }: TodayRoutineBannerProps) {
  const { t } = useTranslation();

  if (isRestDay || !routineName) {
    return (
      <View style={styles.banner}>
        <Icon name="moon-outline" size={18} color={colors.ink} />
        <Text variant="label" weight="bold" style={styles.label}>
          {t('challengeProgress.todayRoutine.restDayMessage')}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text variant="label" weight="bold" style={styles.label}>
        {t('challengeProgress.todayRoutine.label')}
      </Text>
      <Text variant="label" style={styles.routineName} numberOfLines={1}>
        {routineName}
      </Text>
      <Icon name="chevron-forward-outline" size={20} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    flexShrink: 0,
    color: colors.ink,
    opacity: 1,
  },
  routineName: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    opacity: 1,
  },
});
