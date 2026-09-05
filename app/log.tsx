import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { safeBack } from '../utils/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Stack } from '../components/layout/stack';
import { Text } from '../components/ui/text';
import { ChallengeQuickPickRow } from '../components/add/challengeQuickPickRow';
import { getMyChallenges } from '../services/user/user.service';
import { getMyProgressPhotos } from '../services/challenge/challenge.service';
import { groupLatestPhotoByChallengeId } from '../services/adapters/challengeState';
import { getLogChallengeQuickPicks, type LogChallengeQuickPick } from '../services/adapters/metricsAdapter';
import { colors, radius, spacing, textOpacity } from '../constants/theme';
import { withAlpha } from '../utils/color';

const BACKDROP_FADE_MS = 220;

/**
 * "Log today's progress" — a floating, centered challenge picker over
 * whichever screen the FAB was tapped from (transparentModal presentation,
 * see app/_layout.tsx), so that screen stays visible, blurred, behind the
 * backdrop instead of being reconstructed here. Step 1 of the log-metrics
 * flow: pick a challenge. Step 2 (the actual metrics entry) is still the
 * existing app/(add)/metrics.tsx, untouched here.
 *
 * Redesigned 2026-09-04 away from a bottom-sheet card (see git history for
 * the previous `sheet` panel anchored to the bottom) to a floating overlay:
 * no card/container behind the title+rows, content centered vertically
 * instead of bottom-anchored, and a real animated backdrop blur instead of
 * a flat dim. Content, copy, challenge data, and navigation behavior are
 * unchanged — visual/layout only.
 *
 * Deliberately a TOP-LEVEL route, not nested inside app/(add)/ — that group
 * is itself registered at the root with `presentation: 'fullScreenModal'`
 * (an opaque modal), so a transparentModal screen nested inside it only
 * reveals that opaque modal's own backdrop, not the tabs screen underneath.
 * Confirmed on device: nesting it there rendered solid white. Living at the
 * root instead makes the tabs navigator the actual "previous screen" a
 * transparent presentation reveals.
 */
export default function LogChallengePicker() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [challenges, setChallenges] = useState<LogChallengeQuickPick[]>([]);
  // Real, reported bug: `challenges` (the LOGGABLE-today quick-pick list,
  // after getLogChallengeQuickPicks filters out rest days/already-logged/
  // non-active ones) landing on zero doesn't mean "not part of any
  // challenge" — it just as often means every active challenge is already
  // done for today. Tracked separately (the raw, unfiltered enrolled count)
  // so the empty state can tell those two real situations apart instead of
  // always showing the "you don't have any challenges" copy.
  const [hasAnyChallenges, setHasAnyChallenges] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Backdrop (blur + dim) fades in on mount rather than snapping straight to
  // full strength — a plain opacity animation on the layer that CONTAINS the
  // BlurView, not on the BlurView's own `intensity` prop: cross-platform
  // intensity animation is unreliable (Android has no real native blur to
  // begin with, see BlurView's own comment below), while fading a wrapping
  // view's opacity is a plain, well-supported Reanimated animation that
  // reads as "blur fading in" regardless of platform.
  const backdropOpacity = useSharedValue(0);
  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: BACKDROP_FADE_MS });
  }, [backdropOpacity]);
  const backdropAnimatedStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  useEffect(() => {
    let active = true;

    Promise.all([getMyChallenges(), getMyProgressPhotos()])
      .then(([myChallenges, photos]) => {
        if (!active) return;
        setHasAnyChallenges(myChallenges.length > 0);
        const latestPhotoByChallengeId = groupLatestPhotoByChallengeId(photos);
        setChallenges(getLogChallengeQuickPicks(myChallenges, latestPhotoByChallengeId));
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleDismiss() {
    safeBack();
  }

  function handleSelectChallenge(challengeId: string) {
    router.replace(`/(add)/metrics?challengeId=${challengeId}`);
  }

  function handleExplore() {
    // app/challenge/explore-all.tsx (the old dedicated screen) is retired —
    // the Challenges tab shows the same Explore list directly now, deep-linked
    // straight into that segment instead of defaulting to Mine.
    router.replace('/(tabs)/challenges?view=explore');
  }

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimatedStyle]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        {/* Real blur on iOS; on Android, `expo-blur`'s own documented default
            (`experimentalBlurMethod: 'none'`) falls back to a plain
            semi-transparent view instead of attempting the experimental
            (perf/graphics-risk) native Android blur — same tradeoff already
            accepted for the nav bar's own BlurView, see
            components/navigation/bottomNavBackground.tsx. Paired with the
            dim layer below, the backdrop still reads as deliberately
            out-of-focus on both platforms rather than a broken one.
            `pointerEvents="none"` so the dismiss Pressable above still
            receives the tap. */}
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={[StyleSheet.absoluteFill, styles.dim]} pointerEvents="none" />
      </Animated.View>

      {/* `box-none`: only the content Pressable below should capture taps —
          the surrounding empty space in this centering wrapper must fall
          through to the backdrop's own dismiss Pressable behind it. */}
      <View style={[styles.centerWrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]} pointerEvents="box-none">
        {/* No-op onPress stops a tap on the content's own empty padding from
            falling through to the backdrop dismiss Pressable behind it. */}
        <Pressable style={styles.content} onPress={() => {}}>
          <Stack gap="xs" style={styles.headerStack}>
            <Text variant="title" size="2xl" align="left">{t('logMetrics.pickChallenge.title')}</Text>
            <Text variant="body" size="sm" tone="secondary" align="left">{t('logMetrics.pickChallenge.subtitle')}</Text>
          </Stack>

          {loading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.stateWrap}>
              <Text variant="body" tone="secondary" align="center">{t('logMetrics.pickChallenge.errorMessage')}</Text>
            </View>
          ) : challenges.length === 0 ? (
            <View style={styles.stateWrap}>
              <Text variant="body" tone="secondary" align="center">
                {hasAnyChallenges
                  ? t('logMetrics.pickChallenge.allLoggedMessage')
                  : t('logMetrics.pickChallenge.emptyMessage')}
              </Text>
              <Pressable onPress={handleExplore} style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}>
                <Text variant="label" weight="bold" style={styles.exploreLabel}>
                  {t('logMetrics.pickChallenge.exploreCta')}
                </Text>
              </Pressable>
            </View>
          ) : (
            // Capped rather than flex:1 — the whole group (title + rows)
            // should size to its own content and sit centered, per the
            // floating-overlay redesign. The cap only matters for accounts
            // with enough active challenges to otherwise overflow the
            // screen; below that it never engages and the list just sizes
            // to its rows.
            <ScrollView
              style={{ maxHeight: windowHeight * 0.45 }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Each challenge is its own independent row — no shared list
                  surface, no per-row card — separated by real gap. */}
              <Stack gap="md">
                {challenges.map((challenge, index) => (
                  <ChallengeQuickPickRow
                    key={challenge.id}
                    challenge={challenge}
                    index={index}
                    onPress={() => handleSelectChallenge(challenge.id)}
                  />
                ))}
              </Stack>
            </ScrollView>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dim: {
    backgroundColor: withAlpha(colors.ink, textOpacity.secondary),
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  // No background, no border radius, no shadow — the floating-overlay
  // redesign has no card/sheet surface behind the title or rows at all,
  // per explicit "remove the modal card / bottom sheet" request.
  content: {
    // spacing.lg (24) — the standard screen-margin token most screens use
    // (Home, Search, Challenges, exercise screens), not spacing.base (16).
    // Also has the effect of narrowing the pill rows below, since they
    // stretch to fill whatever width this container leaves them.
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  headerStack: {
    paddingHorizontal: spacing.sm,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  stateWrap: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  exploreButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.big,
    backgroundColor: colors.ink,
  },
  exploreLabel: {
    color: colors.primary,
    opacity: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
