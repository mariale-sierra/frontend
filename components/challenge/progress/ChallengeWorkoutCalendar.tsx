import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { IconButton } from '../../ui/iconButton';
import { colors, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { useChallengeCalendar } from '../../../hooks/useChallengeCalendar';
import type { CalendarCell } from '../../../utils/challengeCalendar';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  startDate: Date;
  totalDays: number;
  currentDay: number;
  photoDays: number[];
  isRestDayFn: (challengeDay: number) => boolean;
  selectedDay: number | null;
  onPressDay: (challengeDay: number) => void;
  /** Activity Color System v2 — this challenge's own accent color, used for
   * the "today" dot/legend swatch (was fixed `secondary`). Falls back to
   * `colors.primary` when the challenge has no dominant category yet, same
   * as everywhere else this resolves — pass `getChallengeAccentColor()`'s
   * result, not the raw category. */
  accentColor: string;
}

interface DayCellProps {
  cell: CalendarCell | null;
  isSelected: boolean;
  onPress: (challengeDay: number) => void;
  accentColor: string;
}

// `photo`/`rest`/`missed` are fixed — a "you logged a photo" marker needs to
// stay meaningful even for a challenge with no dominant category yet (white
// would just look unstyled/lost), same reasoning as the progress ring's tick
// colors and legend. `today` is NOT in this map — it resolves to the
// challenge's own activity accent color instead (was fixed `secondary`),
// passed in via the `accentColor` prop.
const STATUS_DOT_COLOR: Record<'photo' | 'rest' | 'missed', string> = {
  photo: colors.success,
  rest: colors.rest,
  missed: colors.error,
};

function DayCell({ cell, isSelected, onPress, accentColor }: DayCellProps) {
  if (!cell || cell.challengeDay === null || !cell.status) {
    return <View style={styles.dayCell} />;
  }

  const { status, challengeDay } = cell;
  const canPress = status === 'photo';
  const dotColor = status === 'today' ? accentColor : STATUS_DOT_COLOR[status as keyof typeof STATUS_DOT_COLOR];

  return (
    <Pressable
      disabled={!canPress}
      onPress={() => onPress(challengeDay)}
      style={({ pressed }) => [styles.dayCell, pressed && canPress && styles.pressed]}
    >
      <View style={styles.markerWrap}>
        {status !== 'future' && (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        )}
        {isSelected && <View style={styles.selectedRing} />}
      </View>
      {status === 'today' ? (
        <Text variant="label" weight="bold" align="center" style={styles.dayTextToday}>{cell.dayOfMonth}</Text>
      ) : status === 'missed' ? (
        <Text variant="label" align="center" style={styles.dayTextMissed}>{cell.dayOfMonth}</Text>
      ) : status === 'future' ? (
        <Text variant="label" tone="tertiary" align="center">{cell.dayOfMonth}</Text>
      ) : (
        <Text variant="label" align="center">{cell.dayOfMonth}</Text>
      )}
    </Pressable>
  );
}

export function ChallengeWorkoutCalendar({
  startDate,
  totalDays,
  currentDay,
  photoDays,
  isRestDayFn,
  selectedDay,
  onPressDay,
  accentColor,
}: Props) {
  const { t } = useTranslation();
  const months = useChallengeCalendar(startDate, totalDays, currentDay, photoDays, isRestDayFn);

  // Default to the month containing "today" (i.e. currentDay) rather than the
  // challenge's first month — for a multi-month challenge, that's the month
  // the user actually cares about on landing, not day 1.
  const defaultMonthIndex = useMemo(() => {
    const todayDate = new Date(startDate);
    todayDate.setDate(todayDate.getDate() + currentDay - 1);
    const index = months.findIndex((m) => m.year === todayDate.getFullYear() && m.month === todayDate.getMonth());
    return index >= 0 ? index : 0;
  }, [months, startDate, currentDay]);

  const [monthIndex, setMonthIndex] = useState(defaultMonthIndex);
  const activeMonth = months[Math.min(monthIndex, months.length - 1)] ?? months[0];

  if (!activeMonth) {
    return <View style={styles.page} />;
  }

  const canGoPrev = monthIndex > 0;
  const canGoNext = monthIndex < months.length - 1;

  return (
    <View style={styles.page}>
      <View style={styles.monthNav}>
        <IconButton
          name="chevron-back-outline"
          variant="surface"
          size={36}
          onPress={() => canGoPrev && setMonthIndex((i) => i - 1)}
          style={!canGoPrev && styles.navDisabled}
          disabled={!canGoPrev}
        />
        <Text variant="subheader">{activeMonth.label}</Text>
        <IconButton
          name="chevron-forward-outline"
          variant="surface"
          size={36}
          onPress={() => canGoNext && setMonthIndex((i) => i + 1)}
          style={!canGoNext && styles.navDisabled}
          disabled={!canGoNext}
        />
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((wd, i) => (
          <Text key={i} variant="label" weight="bold" style={styles.weekday}>{wd}</Text>
        ))}
      </View>
      <View style={styles.weekdayUnderline} />

      {activeMonth.weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((cell, ci) => (
            <DayCell
              key={ci}
              cell={cell}
              isSelected={cell?.challengeDay === selectedDay && selectedDay !== null}
              onPress={onPressDay}
              accentColor={accentColor}
            />
          ))}
        </View>
      ))}

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text variant="caption" tone="secondary">{t('challengeProgress.consistency.legendPhotoIn')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.rest }]} />
          <Text variant="caption" tone="secondary">{t('challengeProgress.consistency.legendRestDay')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text variant="caption" tone="secondary">{t('challengeProgress.consistency.legendMissed')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: accentColor }]} />
          <Text variant="caption" tone="secondary">{t('challengeProgress.consistency.legendToday')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // No paddingTop here — the "Consistency" toggle row above (screen-level
  // consistencyHeader) already contributes its own paddingBottom; adding
  // one here too was double-counting that gap (see the wireframe: the
  // toggle row's own `0 16px 12px` is the ONLY vertical space between it
  // and this view, not stacked with a second one).
  page: {
    paddingHorizontal: spacing.base,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  navDisabled: {
    opacity: 0.35,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  weekdayUnderline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: withAlpha(colors.paper, 0.08),
  },
  weekRow: {
    minHeight: 46,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  markerWrap: {
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectedRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.4,
    borderColor: colors.paper,
  },
  dayTextToday: {
    color: colors.secondary,
    // Text's tone-opacity applies even under a custom `color` override —
    // reset to fully opaque (see components/ui/text.tsx's warning).
    opacity: 1,
  },
  dayTextMissed: {
    color: colors.error,
    opacity: 1,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
    columnGap: spacing.base,
    paddingTop: spacing.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
