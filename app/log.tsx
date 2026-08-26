import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
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

/**
 * "Log today's progress" — a bottom sheet over whichever screen the FAB was
 * tapped from (transparentModal presentation, see app/_layout.tsx), so that
 * screen stays visible, dimmed, behind the scrim instead of being
 * reconstructed here. Step 1 of the log-metrics flow: pick a challenge.
 * Step 2 (the actual metrics entry) is still the existing
 * app/(add)/metrics.tsx, untouched in this pass — see the design system skill.
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([getMyChallenges(), getMyProgressPhotos()])
      .then(([myChallenges, photos]) => {
        if (!active) return;
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
    router.back();
  }

  function handleSelectChallenge(challengeId: string) {
    router.replace(`/(add)/metrics?challengeId=${challengeId}`);
  }

  function handleExplore() {
    router.replace('/challenge/explore-all');
  }

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />

      {/* Inner Pressable with a no-op onPress stops a tap on the sheet's own
          empty padding from falling through to the backdrop Pressable behind it.
          Fixed at half the screen's height — never taller, regardless of how
          many challenges there are. Only the list below the title scrolls; the
          sheet's own bounds never move. */}
      <Pressable style={[styles.sheet, { height: windowHeight * 0.5 }]} onPress={() => {}}>
        <View style={styles.handle} />

        <Stack gap="xs">
          <Text variant="title" size="2xl">{t('logMetrics.pickChallenge.title')}</Text>
          <Text variant="body" size="sm" tone="secondary">{t('logMetrics.pickChallenge.subtitle')}</Text>
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
            <Text variant="body" tone="secondary" align="center">{t('logMetrics.pickChallenge.emptyMessage')}</Text>
            <Pressable onPress={handleExplore} style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}>
              <Text variant="label" weight="bold" style={styles.exploreLabel}>
                {t('logMetrics.pickChallenge.exploreCta')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}
            showsVerticalScrollIndicator={false}
          >
            <Stack gap="sm">
              {challenges.map((challenge) => (
                <ChallengeQuickPickRow
                  key={challenge.id}
                  challenge={challenge}
                  onPress={() => handleSelectChallenge(challenge.id)}
                />
              ))}
            </Stack>
          </ScrollView>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: withAlpha(colors.ink, textOpacity.secondary),
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.big,
    borderTopRightRadius: radius.big,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    gap: spacing.base,
  },
  list: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.small,
    backgroundColor: withAlpha(colors.paper, textOpacity.tertiary),
    alignSelf: 'center',
  },
  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
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
