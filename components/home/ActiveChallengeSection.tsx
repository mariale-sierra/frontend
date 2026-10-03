import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { ActiveChallengeItemV2 } from './ActiveChallengeItemV2';
import { useHomeChallengeCard } from './useHomeChallengeCard';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { USE_GLOW_CHALLENGE_CARDS } from '../../constants/challengeCards';
import { withAlpha } from '../../utils/color';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';

const ITEM_WIDTH = Dimensions.get('window').width - spacing.lg * 2;
const SEPARATOR_WIDTH = spacing.md;
/** How far the carousel scrolls from one card to the next, in px. */
export const ACTIVE_CHALLENGE_SNAP_INTERVAL = ITEM_WIDTH + SEPARATOR_WIDTH;

interface Props {
  challenges: HomeActiveChallengeViewModel[];
  hoursLeft: number;
  /** Fed the carousel's horizontal scroll offset as it scrolls, so something
   * outside it (Home's background light) can follow the card in view. */
  scrollX?: Animated.Value;
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

// The classic Home hero card: a solid full-color card. Its logic (where a tap
// goes, which state pill shows, how far along it is) lives in
// `useHomeChallengeCard`, shared with the newer `ActiveChallengeItemV2`.
const ChallengeItem = memo(function ChallengeItem({ challenge, hoursLeft }: ItemProps) {
  const { t } = useTranslation();
  const {
    stateColor: accentColor,
    status,
    progress,
    accessibilityLabel,
    onPress: handlePress,
  } = useHomeChallengeCard(challenge, hoursLeft);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, { backgroundColor: accentColor }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.topRow}>
        <Text variant="header" inverse tone="secondary">{t('home.activeChallenge')}</Text>

        {status ? <StatusPill icon={status.icon} label={status.label} accentColor={accentColor} /> : null}
      </View>

      <Text variant="subheader" inverse>{challenge.title}</Text>

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

export const ActiveChallengeSection = memo(function ActiveChallengeSection({
  challenges,
  hoursLeft,
  scrollX,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / ACTIVE_CHALLENGE_SNAP_INTERVAL);
    setActiveIndex(Math.max(0, Math.min(index, challenges.length - 1)));
  }

  // The list starts at its first card each time it is built, so the offset it
  // reports does too (it would otherwise keep whatever it was left at).
  useEffect(() => {
    scrollX?.setValue(0);
  }, [scrollX]);

  // Reports the offset natively, so whatever follows it tracks the finger.
  const handleScroll = useMemo(
    () =>
      scrollX
        ? Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })
        : undefined,
    [scrollX],
  );

  // Which hero card design to show — see `constants/challengeCards.ts`. The
  // newer card fills whatever it's put in, so it gets the carousel's item width
  // from this wrapper; the classic card carries its own width.
  const renderItem = useCallback(
    ({ item }: { item: HomeActiveChallengeViewModel }) =>
      USE_GLOW_CHALLENGE_CARDS ? (
        <View style={styles.glowItem}>
          <ActiveChallengeItemV2 challenge={item} hoursLeft={hoursLeft} />
        </View>
      ) : (
        <ChallengeItem challenge={item} hoursLeft={hoursLeft} />
      ),
    [hoursLeft],
  );

  return (
    <View>
      <Animated.FlatList
        data={challenges}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.challengeId}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ChallengeSeparator}
        snapToInterval={ACTIVE_CHALLENGE_SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
  glowItem: {
    width: ITEM_WIDTH,
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
