import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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

function ChallengeItem({ challenge, hoursLeft }: ItemProps) {
  const { t } = useTranslation();
  const showTimeBadge = !challenge.isCompleted && !challenge.isTodayCompleted && hoursLeft > 0;

  return (
    <View style={styles.item}>
      <Text variant="subheader">{challenge.title}</Text>

      <View style={styles.progressRow}>
        <Text style={styles.currentDay}>{challenge.currentDay}</Text>
        <Text style={styles.totalDays}>/{challenge.totalDays}</Text>
      </View>

      {challenge.isCompleted ? (
        <View style={[styles.badge, styles.completedBadge]}>
          <Text style={styles.completedText}>{t('home.completed')}</Text>
        </View>
      ) : showTimeBadge ? (
        <View style={styles.badge}>
          <Icon name="time-outline" size={13} color={colors.textPrimary} />
          <Text style={styles.badgeText}>{t('home.hoursLeft', { hours: hoursLeft })}</Text>
        </View>
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
    width: spacing.xl * 2,
  },
  item: {
    width: ITEM_WIDTH,
    gap: spacing.sm,
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
    borderColor: colors.textPrimary,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  completedBadge: {
    borderColor: colors.success,
  },
  completedText: {
    ...typography.caption,
    color: colors.success,
  },
});
