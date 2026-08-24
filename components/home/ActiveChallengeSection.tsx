import { useState } from 'react';
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';

const ITEM_WIDTH = Dimensions.get('window').width - spacing.lg * 2;
const SEPARATOR_WIDTH = spacing.md;
const SNAP_INTERVAL = ITEM_WIDTH + SEPARATOR_WIDTH;

interface Props {
  challenges: HomeActiveChallengeViewModel[];
  hoursLeft: number;
}

interface ItemProps {
  challenge: HomeActiveChallengeViewModel;
  hoursLeft: number;
}

// Ink pill regardless of state — see the Hero CTA card / Status Card rules
// in havit-design-system-SKILL.md — but the icon + text pick up the same
// state color as the card background, so the pill reads as part of that
// state rather than always defaulting to the brand lime.
function StatusPill({
  icon,
  label,
  accentColor,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  accentColor: string;
}) {
  return (
    <View style={styles.pill}>
      <Icon name={icon} size={13} color={accentColor} />
      <Text variant="label" weight="bold" inverse style={[styles.pillText, { color: accentColor }]}>{label}</Text>
    </View>
  );
}

// Hero card background signals challenge state — confirmed exception to the
// Status Card rule being scoped to Challenges-Mine, see design system →
// Status Card exception. Rest day = `rest`, completed = `success`, otherwise
// the default `primary`. The status pill's accent reuses this same color.
function cardBackgroundColor(challenge: HomeActiveChallengeViewModel): string {
  if (challenge.isRestDay) return colors.rest;
  if (challenge.isCompleted) return colors.success;
  return colors.primary;
}

function ChallengeItem({ challenge, hoursLeft }: ItemProps) {
  const { t } = useTranslation();
  const showTimeBadge =
    !challenge.isCompleted && !challenge.isTodayCompleted && !challenge.isRestDay && hoursLeft > 0;
  const progress = challenge.totalDays > 0 ? Math.min(challenge.currentDay / challenge.totalDays, 1) : 0;

  const accentColor = cardBackgroundColor(challenge);

  return (
    <View style={[styles.card, { backgroundColor: accentColor }]}>
      <View style={styles.topRow}>
        <Text variant="header" inverse tone="secondary">{t('home.activeChallenge')}</Text>

        {challenge.isCompleted ? (
          <StatusPill icon="checkmark-circle-outline" label={t('home.completed')} accentColor={accentColor} />
        ) : challenge.isRestDay ? (
          <StatusPill icon="moon-outline" label={t('home.restDay')} accentColor={accentColor} />
        ) : challenge.isTodayCompleted ? (
          <StatusPill icon="checkmark-circle-outline" label={t('home.todayLogged')} accentColor={colors.success} />
        ) : showTimeBadge ? (
          <StatusPill icon="flame-outline" label={t('home.hoursLeft', { hours: hoursLeft })} accentColor={accentColor} />
        ) : null}
      </View>

      <Text variant="body" size="xl" weight="bold" inverse>{challenge.title}</Text>

      <View style={styles.progressArea}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text variant="label" inverse style={styles.dayText}>
          {t('home.dayOf', { current: challenge.currentDay })}
          <Text variant="label" inverse tone="secondary"> / {challenge.totalDays}</Text>
        </Text>
      </View>
    </View>
  );
}

export function ActiveChallengeSection({ challenges, hoursLeft }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    setActiveIndex(Math.max(0, Math.min(index, challenges.length - 1)));
  }

  return (
    <View>
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
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <ChallengeItem challenge={item} hoursLeft={hoursLeft} />
        )}
      />

      {challenges.length > 1 && (
        <View style={styles.dots}>
          {challenges.map((item, index) => (
            <View
              key={item.challengeId}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  separator: {
    width: SEPARATOR_WIDTH,
  },
  card: {
    width: ITEM_WIDTH,
    borderRadius: radius.big,
    padding: spacing.base,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.small,
    backgroundColor: colors.ink,
  },
  pillText: {
    color: colors.primary,
    textTransform: 'uppercase',
  },
  progressArea: {
    gap: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.small,
    backgroundColor: withAlpha(colors.ink, 0.18),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.small,
    backgroundColor: colors.ink,
  },
  dayText: {
    textTransform: 'none',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.small,
    backgroundColor: withAlpha(colors.paper, 0.22),
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});
