import { memo, useCallback, useState } from 'react';
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getChallengeCardColor } from '../../services/adapters/challengeState';
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
      <Text variant="label" weight="bold" style={[styles.pillText, { color: accentColor }]}>{label}</Text>
    </View>
  );
}

const ChallengeItem = memo(function ChallengeItem({ challenge, hoursLeft }: ItemProps) {
  const { t } = useTranslation();
  const router = useRouter();
  // Per explicit request: tapping the card jumps straight into logging
  // today's progress for THIS challenge (skipping the challenge-picker
  // sheet, same `/(add)/metrics?challengeId=` shortcut Challenges-Mine's
  // own "Add photo" square already uses) — but only when there's actually
  // something to log today. `rest`/`completed` have nothing to log (no
  // routine today / already logged today), so those go to the challenge's
  // own progress screen instead, same destination Challenges-Mine's card
  // itself opens on a normal tap (`/challenge/:id/progress`).
  function handlePress() {
    if (challenge.state === 'active') {
      router.push(`/(add)/metrics?challengeId=${challenge.challengeId}`);
    } else {
      router.push(`/challenge/${challenge.challengeId}/progress`);
    }
  }
  // Card background signals state — same shared getChallengeCardColor()
  // (challengeState.ts) used by Challenges-Mine's status card and the
  // progress-ring eyebrow. `rest`/`completed` keep their own fixed meaning
  // (purple/green) unchanged; only `active` resolves to the challenge's own
  // dominant-activity color now (Activity Color System v2), falling back to
  // `colors.primary` (white) when the challenge has no dominant category
  // yet. `completed` means TODAY has a logged photo, not "the whole
  // challenge is done" (a genuinely finished/left challenge never reaches
  // this component at all — getHomeChallengesSorted excludes those, see
  // homeAdapter.ts).
  const accentColor = getChallengeCardColor(challenge.state, challenge.dominantActivityCategory);
  const showTimeBadge = challenge.state === 'active' && hoursLeft > 0;
  const progress = challenge.totalDays > 0 ? Math.min(challenge.currentDay / challenge.totalDays, 1) : 0;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, { backgroundColor: accentColor }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={
        challenge.state === 'active'
          ? t('home.logProgressA11y', { name: challenge.title })
          : t('home.openChallengeA11y', { name: challenge.title })
      }
    >
      <View style={styles.topRow}>
        <Text variant="header" inverse tone="secondary">{t('home.activeChallenge')}</Text>

        {challenge.state === 'completed' ? (
          <StatusPill icon="checkmark-outline" label={t('home.completed')} accentColor={accentColor} />
        ) : challenge.state === 'rest' ? (
          <StatusPill icon="moon-outline" label={t('home.restDay')} accentColor={accentColor} />
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
    </Pressable>
  );
});

function ChallengeSeparator() {
  return <View style={styles.separator} />;
}

export const ActiveChallengeSection = memo(function ActiveChallengeSection({ challenges, hoursLeft }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    setActiveIndex(Math.max(0, Math.min(index, challenges.length - 1)));
  }

  const renderItem = useCallback(
    ({ item }: { item: HomeActiveChallengeViewModel }) => <ChallengeItem challenge={item} hoursLeft={hoursLeft} />,
    [hoursLeft],
  );

  return (
    <View>
      <FlatList
        data={challenges}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.challengeId}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ChallengeSeparator}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={renderItem}
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
});

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
  pressed: {
    opacity: 0.9,
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
    textTransform: 'uppercase',
    // Text's tone-opacity (85% by default) applies even to a custom `color`
    // override — cancel it back to fully opaque, same fix as
    // ChallengeStatusCard's pill text.
    opacity: 1,
  },
  progressArea: {
    gap: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.small,
    backgroundColor: withAlpha(colors.ink, fillOpacity.washOnAccent),
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
