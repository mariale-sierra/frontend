import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Row } from '../../layout/row';
import { Icon } from '../../ui/icon';
import { IconButton } from '../../ui/iconButton';
import { Text } from '../../ui/text';
import { colors, fillOpacity, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

export type CycleDayStatus = 'empty' | 'configured' | 'rest';

interface CycleDayListProps {
  totalDays: number;
  getDayStatus: (dayNumber: number) => CycleDayStatus;
  getDayRoutineLabel: (dayNumber: number) => string | undefined;
  getDayRoutineMeta: (dayNumber: number) => string | undefined;
  /** Activity Color System v2 — the assigned routine's own dominant activity
   * color for a configured workout day (falls back to `colors.primary` when
   * that routine has no exercises yet). Unused for `empty`/`rest` days,
   * which keep their own fixed treatment. */
  getDayRoutineColor: (dayNumber: number) => string;
  onPressDay: (dayNumber: number) => void;
  onRemoveDay: (dayNumber: number) => void;
  onAddDay: () => void;
}

const REMOVE_ICON_COLOR = withAlpha(colors.paper, textOpacity.tertiary);

/** "Build the cycle" day list — a numbered-badge row per day, adapted from the
 * same badge/card tokens as Challenge-Info's `ChallengeRoutineDayCard` (30×30
 * `radius.big` badge, `surface`/`medium` card) but with its own Add/Edit/×
 * interaction contract, since this screen builds the cycle rather than
 * displaying it read-only. */
export function CycleDayList({
  totalDays,
  getDayStatus,
  getDayRoutineLabel,
  getDayRoutineMeta,
  getDayRoutineColor,
  onPressDay,
  onRemoveDay,
  onAddDay,
}: CycleDayListProps) {
  const { t } = useTranslation();
  const days = useMemo(() => Array.from({ length: totalDays }, (_, index) => index + 1), [totalDays]);
  const canRemove = totalDays > 1;

  const { trainingDays, restDays, allConfigured } = useMemo(() => {
    let training = 0;
    let rest = 0;
    for (const day of days) {
      const status = getDayStatus(day);
      if (status === 'configured') training += 1;
      if (status === 'rest') rest += 1;
    }
    return { trainingDays: training, restDays: rest, allConfigured: training + rest === days.length };
  }, [days, getDayStatus]);

  return (
    <View style={styles.container}>
      <Row justify="space-between" align="flex-end">
        <Text variant="header" tone="secondary">
          {t('challengeCreate.cycle.daysInCycle', { count: totalDays })}
        </Text>
      </Row>

      <View style={styles.list}>
        {days.map((day) => {
          const status = getDayStatus(day);
          const isRest = status === 'rest';
          const badgeColor = status === 'empty' ? withAlpha(colors.paper, fillOpacity.strong) : isRest ? colors.rest : getDayRoutineColor(day);
          const routineLabel = getDayRoutineLabel(day);
          const meta = getDayRoutineMeta(day);

          return (
            <Pressable
              key={`cycle-day-${day}`}
              onPress={() => onPressDay(day)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <Text variant="label" weight="bold" style={status === 'empty' ? styles.badgeTextNeutral : styles.badgeText}>
                  {day}
                </Text>
              </View>

              <View style={styles.textColumn}>
                {status === 'empty' ? (
                  <Text variant="body" tone="secondary" numberOfLines={1}>
                    {t('challengeCreate.cycle.nothingSetYet')}
                  </Text>
                ) : (
                  <>
                    <Text
                      variant="body"
                      weight="bold"
                      numberOfLines={1}
                      style={isRest ? styles.restTitle : styles.title}
                    >
                      {isRest ? t('challengeInfo.restDayLabel') : routineLabel}
                    </Text>
                    <Text variant="caption" tone="secondary" numberOfLines={1}>
                      {isRest ? t('challengeInfo.restDayNoPhoto') : meta}
                    </Text>
                  </>
                )}
              </View>

              {status === 'empty' ? (
                <View style={styles.addPill}>
                  <Icon name="add-outline" size={16} color={colors.ink} />
                  <Text variant="label" weight="bold" style={styles.addPillLabel}>
                    {t('challengeCreate.cycle.add')}
                  </Text>
                </View>
              ) : (
                <Icon name="pencil-outline" size={18} color={withAlpha(colors.paper, textOpacity.secondary)} />
              )}

              <IconButton
                name="close-outline"
                size={28}
                iconSize={14}
                iconColor={canRemove ? REMOVE_ICON_COLOR : withAlpha(colors.paper, 0.12)}
                disabled={!canRemove}
                onPress={(event) => {
                  event.stopPropagation();
                  onRemoveDay(day);
                }}
              />
            </Pressable>
          );
        })}

        <Pressable
          onPress={onAddDay}
          style={({ pressed }) => [styles.addDayButton, pressed && styles.pressed]}
        >
          <Icon name="add-outline" size={16} color={colors.primary} />
          <Text variant="label" weight="bold" style={styles.addDayLabel}>
            {t('challengeCreate.cycle.addDay')}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.banner, { backgroundColor: withAlpha(allConfigured ? colors.success : colors.rest, allConfigured ? 0.1 : 0.12) }]}>
        <Icon
          name={allConfigured ? 'checkmark-circle-outline' : 'information-circle-outline'}
          size={18}
          color={allConfigured ? colors.success : colors.rest}
        />
        <Text variant="caption" style={styles.bannerText}>
          {allConfigured
            ? t('challengeCreate.cycle.bannerComplete', { count: restDays, trainingDays, restDays })
            : t('challengeCreate.cycle.bannerIncomplete')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    color: colors.ink,
    opacity: 1,
  },
  badgeTextNeutral: {
    opacity: 1,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    opacity: 1,
  },
  restTitle: {
    color: colors.rest,
    opacity: 1,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
  },
  addPillLabel: {
    color: colors.ink,
    opacity: 1,
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.medium,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: withAlpha(colors.paper, 0.22),
    paddingVertical: spacing.md,
  },
  addDayLabel: {
    color: colors.primary,
    opacity: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  bannerText: {
    flex: 1,
  },
});
