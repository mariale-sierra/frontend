import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { Row } from '../../layout/row';
import { colors, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import ChallengeRoutineDayCard from './challengeRoutineDayCard';
import type { ChallengeDaySummary } from '../../../services/adapters/challengeDetailAdapter';

interface ChallengeRoutineListProps {
  days: ChallengeDaySummary[];
  cycleLengthDays: number;
  durationDays: number;
  /** Activity Color System v2 — this challenge's own resolved accent color,
   * passed through to each workout day's numbered badge. */
  accentColor: string;
  onPressDay?: (day: number) => void;
  /** Shown instead of the day rows when the routine isn't visible to this
   * viewer (a private challenge they're not in yet). */
  hiddenNotice?: string;
}

/**
 * "The cycle" section (Challenge-Info wireframe). One row per cycle day
 * (already cycle-scoped by the adapter — see challengeDetailAdapter.ts's doc
 * comment), flat list, no pagination — replaces the old week-by-week pager,
 * which doesn't apply to a cycle-based model (a cycle repeats as a whole,
 * it isn't paged through).
 */
export default function ChallengeRoutineList({ days, cycleLengthDays, durationDays, accentColor, onPressDay, hiddenNotice }: ChallengeRoutineListProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text variant="subheader" style={styles.title}>{t('challengeInfo.cycleTitle')}</Text>

      <Row gap="xs" align="center" style={styles.caption}>
        <Icon name="repeat-outline" size={16} color={colors.paper} />
        <Text variant="label" weight="bold">
          {t('challengeInfo.cycleCaption', {
            cycleDays: t('challenges.durationDaysLabel', { count: cycleLengthDays }),
            totalDays: t('challenges.durationDaysLabel', { count: durationDays }),
          })}
        </Text>
      </Row>

      {hiddenNotice ? (
        <Row gap="sm" align="center" testID="challenge-routine-hidden">
          <Icon name="lock-closed-outline" size={16} color={withAlpha(colors.paper, textOpacity.secondary)} />
          <Text variant="body" tone="secondary" style={styles.hiddenNotice}>
            {hiddenNotice}
          </Text>
        </Row>
      ) : (
        <View style={styles.dayList}>
          {days.map((item) => (
            <ChallengeRoutineDayCard
              key={`cycle-day-${item.day}`}
              day={item.day}
              isRestDay={item.isRestDay}
              routineName={item.routineName}
              subtitle={t('challengeInfo.exerciseSummary', {
                exercises: t('challengeInfo.exerciseCount', { count: item.exerciseCount }),
                location: item.location,
              })}
              accentColor={accentColor}
              onPress={() => onPressDay?.(item.day)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
  },
  title: {
    marginBottom: spacing.sm,
  },
  caption: {
    marginBottom: spacing.md,
  },
  dayList: {
    gap: spacing.md,
  },
  hiddenNotice: {
    flex: 1,
  },
});
