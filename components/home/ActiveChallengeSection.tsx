import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';

const ITEM_WIDTH = Dimensions.get('window').width - spacing.lg * 2;
const SEPARATOR_WIDTH = spacing.xl * 2;
const SNAP_INTERVAL = ITEM_WIDTH + SEPARATOR_WIDTH;

interface Props {
  challenges: HomeActiveChallengeViewModel[];
  hoursLeft: number;
}

interface ItemProps {
  challenge: HomeActiveChallengeViewModel;
  hoursLeft: number;
}

function TimeBadge({ hoursLeft }: { hoursLeft: number }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.badge, styles.timeBadge]}>
      <Icon name="time-outline" size={13} color={colors.textPrimary} />
      <Text style={styles.timeBadgeText}>{t('home.hoursLeft', { hours: hoursLeft })}</Text>
    </View>
  );
}

function CompletedBadge() {
  const { t } = useTranslation();
  return (
    <View style={[styles.badge, styles.completedBadge]}>
      <Text style={styles.completedBadgeText}>{t('home.completed')}</Text>
    </View>
  );
}

function RestDayBadge() {
  return (
    <View style={[styles.badge, styles.restDayBadge]}>
      <Ionicons name="moon" size={12} color={colors.restDayNeon} />
      <Text style={styles.restDayBadgeText}>Rest Day</Text>
    </View>
  );
}

function TodayLoggedBadge() {
  const { t } = useTranslation();
  return (
    <View style={[styles.badge, styles.todayLoggedBadge]}>
      <Ionicons name="checkmark-circle" size={13} color={colors.success} />
      <Text style={styles.todayLoggedBadgeText}>{t('home.todayLogged')}</Text>
    </View>
  );
}

function ChallengeItem({ challenge, hoursLeft }: ItemProps) {
  const showTimeBadge =
    !challenge.isCompleted && !challenge.isTodayCompleted && !challenge.isRestDay && hoursLeft > 0;

  return (
    <View style={[styles.item, challenge.streakCount > 0 && styles.itemStreakGlow]}>
      <Text variant="subheader">{challenge.title}</Text>

      <View style={styles.progressRow}>
        <Text style={styles.currentDay}>{challenge.currentDay}</Text>
        <Text style={styles.totalDays}>/{challenge.totalDays}</Text>
      </View>

      {challenge.isCompleted ? (
        <CompletedBadge />
      ) : challenge.isRestDay ? (
        <RestDayBadge />
      ) : challenge.isTodayCompleted ? (
        <TodayLoggedBadge />
      ) : showTimeBadge ? (
        <TimeBadge hoursLeft={hoursLeft} />
      ) : null}
    </View>
  );
}

export function ActiveChallengeSection({ challenges, hoursLeft }: Props) {
  return (
    <FlatList
      data={challenges}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.challengeId}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      snapToInterval={SNAP_INTERVAL}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      renderItem={({ item }) => (
        <ChallengeItem challenge={item} hoursLeft={hoursLeft} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  separator: {
    width: SEPARATOR_WIDTH,
  },
  item: {
    width: ITEM_WIDTH,
    gap: spacing.sm,
  },
  itemStreakGlow: {
    borderRadius: radius.xl,
    padding: spacing.md,
    marginHorizontal: -spacing.md,
    shadowColor: colors.streakGlow,
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.streakGlow,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentDay: {
    ...typography.stat,
    color: colors.textPrimary,
  },
  totalDays: {
    ...typography.statSmall,
    color: colors.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius['2xl'],
    borderWidth: 1,
  },
  timeBadge: {
    borderColor: colors.textPrimary,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 3,
  },
  timeBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  completedBadge: {
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  completedBadgeText: {
    ...typography.caption,
    color: colors.success,
  },
  restDayBadge: {
    borderColor: colors.restDayNeon,
    shadowColor: colors.restDayNeon,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 5,
  },
  restDayBadgeText: {
    ...typography.caption,
    color: colors.restDayNeon,
  },
  todayLoggedBadge: {
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 3,
  },
  todayLoggedBadgeText: {
    ...typography.caption,
    color: colors.success,
  },
});
