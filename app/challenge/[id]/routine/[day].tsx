import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import ScreenBackground from '../../../../components/layout/screenBackground';
import { Row } from '../../../../components/layout/row';
import { BackButton } from '../../../../components/ui/backButton';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { ChallengeAccentBackdrop } from '../../../../components/challenge/challengeAccentBackdrop';
import { UpcomingDayCard } from '../../../../components/challenge/detail/UpcomingDayCard';
import { colors, radius, spacing, textOpacity } from '../../../../constants/theme';
import { withAlpha } from '../../../../utils/color';
import { toTitleCase } from '../../../../utils/format';
import { toChallengeDetailViewModel } from '../../../../services/adapters/index';
import { getUpcomingDays } from '../../../../services/adapters/challengeDetailAdapter';
import { getChallenge, joinChallenge } from '../../../../services/challenge/challenge.service';
import { getMyChallenges } from '../../../../services/user/user.service';
import { getChallengeAccentColor, pickDominantActivityCategory } from '../../../../services/adapters/challengeState';
import {
  activityTypeFromMetricCodes,
  targetsToFieldMap,
  toNum,
} from '../../../../services/adapters/metricsAdapter';
import { ACTIVITY_METRIC_CONFIG } from '../../../../types/metrics';
import { useConfirmationPopup } from '../../../../hooks/useConfirmationPopup';
import { useOpenExercise } from '../../../../hooks/useOpenExercise';
import { useErrorNotificationStore } from '../../../../store/errorNotificationStore';
import type { ChallengeContract, ChallengeCycleDayContract, ChallengeExerciseSetContract, ChallengeExerciseTargetContract } from '../../../../types/challenge';
import type { TFunction } from 'i18next';

type MembershipStatus = 'creator' | 'joined' | 'none';

// The chevron on an exercise row, that says tapping it opens the exercise.
const EXERCISE_CHEVRON_SIZE = 14;

interface ExerciseRow {
  name: string;
  /** "4 × 12" / "3 × 45s" style. */
  setsLabel: string;
  restLabel: string;
  /** The exercise's name as the catalog stores it ("HIP THRUST") — what tapping
   * the row looks the exercise up by, to open its screen. */
  catalogName: string;
}

/** "45" → "45s", "90" → "1m 30s" — the terse table-cell form. Distinct from
 * `metricsAdapter.ts`'s own `restLabel()`, which spells out "Rest 1m 30s"
 * for the Log-Metrics stepper screen's different, spoken-word context. */
function formatSeconds(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/** MetricField → its short table-cell unit suffix. Reps/rounds read fine
 * bare ("12"); the others need a unit to not read as a bare, ambiguous number. */
function formatFieldValue(field: 'reps' | 'lbs' | 'duration' | 'distance' | 'rounds', value: number): string {
  switch (field) {
    case 'lbs':
      return `${value} lbs`;
    case 'duration':
      return formatSeconds(value);
    case 'distance':
      return `${value} km`;
    default:
      return `${value}`;
  }
}

/**
 * Real per-set data, wired 2026-08-30 once `ChallengesService.getCycleDaySummaries()`
 * was extended to join it (backend commit shipped the same day) — was flat
 * placeholder numbers for every exercise before this (see git history / the
 * design system skill's Open Items Tracker for that gap's own writeup).
 * Reuses `metricsAdapter.ts`'s target-extraction helpers rather than a
 * second parallel implementation — the response shape is deliberately the
 * same one `RoutineService.getTodayRoutine()` already returns.
 */
function buildExerciseRows(cycleDay: ChallengeCycleDayContract | undefined, t: TFunction): ExerciseRow[] {
  const exercises = Array.isArray(cycleDay?.exercises) ? cycleDay.exercises : [];
  return exercises.map((exercise, index) => {
    const rawName = typeof exercise.name === 'string' && exercise.name.trim() ? exercise.name.trim() : `Exercise ${index + 1}`;
    const sets: ChallengeExerciseSetContract[] = Array.isArray(exercise.sets) ? exercise.sets : [];
    const exerciseTargets: ChallengeExerciseTargetContract[] = Array.isArray(exercise.targets) ? exercise.targets : [];

    const metricCodes = [
      ...sets.flatMap((set) => (set.targets ?? []).map((target) => target.metricType?.code)),
      ...exerciseTargets.map((target) => target.metricType?.code),
    ].filter((code): code is string => Boolean(code));
    const activityType = activityTypeFromMetricCodes(metricCodes);
    const primaryField = ACTIVITY_METRIC_CONFIG[activityType]?.columns[0]?.key ?? ACTIVITY_METRIC_CONFIG.strength.columns[0].key;

    const exerciseFieldMap = targetsToFieldMap(exerciseTargets);
    const firstSetFieldMap = sets.length > 0 ? targetsToFieldMap(sets[0].targets) : {};
    const primaryValue = firstSetFieldMap[primaryField] ?? exerciseFieldMap[primaryField];

    let setsLabel: string;
    if (primaryValue != null) {
      const formatted = formatFieldValue(primaryField, primaryValue);
      setsLabel = sets.length > 0 ? `${sets.length} × ${formatted}` : formatted;
    } else if (sets.length > 0) {
      setsLabel = t('challengeRoutineDay.setsCountLabel', { count: sets.length });
    } else {
      setsLabel = '—';
    }

    // Same "first set's own rest value represents the exercise" convention
    // `metricsAdapter.ts`'s `adaptTodayRoutineExercises` already uses.
    const restSeconds = toNum(sets[0]?.rest_seconds_after ?? null);
    const restLabel = restSeconds != null ? formatSeconds(restSeconds) : '—';

    return {
      // The shared exercise-library catalog stores names in all caps
      // ("HIP THRUST") — toTitleCase() normalizes that for display without
      // touching a name that's already reasonably cased. See its own doc
      // comment (utils/format.ts) for why this looked like a font bug at
      // first: shouty-uppercase text read as "unstyled" against the
      // wireframe's plain-case design, not an actual missing-font issue.
      name: toTitleCase(rawName),
      setsLabel,
      restLabel,
      catalogName: rawName,
    };
  });
}

export default function RoutineDayDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, day } = useLocalSearchParams<{ id: string; day: string }>();
  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('none');
  const [membershipLoading, setMembershipLoading] = useState(true);
  const { showSuccess } = useErrorNotificationStore();

  const joinPopup = useConfirmationPopup({
    type: 'join',
    challengeName: challenge?.name ?? t('challenges.fallbackName'),
    onConfirm: async () => {
      const challengeId = typeof id === 'string' ? id : '';
      if (!challengeId) return;
      try {
        await joinChallenge(challengeId);
        setMembershipStatus('joined');
        // Same fix as app/challenge/[id]/index.tsx's own join flow, per
        // explicit follow-up — this screen has its own separate Join
        // button/popup (reachable from Explore without passing through
        // Challenge-Info first), so it needed the identical success
        // toast + redirect-to-Mine treatment, not just the other screen.
        showSuccess({ message: t('challenges.joinConfirm.success', { name: challenge?.name ?? t('challenges.fallbackName') }) });
        router.replace('/(tabs)/challenges?view=mine');
      } catch {
        // Confirmation popup surfaces its own error state.
      }
    },
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getChallenge(String(id))
      .then((data) => {
        if (!cancelled) setChallenge(data);
      })
      .catch(() => {
        if (!cancelled) setChallenge(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!challenge) return;
    getMyChallenges()
      .then((enrolled) => {
        const isMember = enrolled.some((c) => String(c.id) === String(challenge.id) && c.status !== 'left');
        setMembershipStatus(isMember ? 'joined' : 'none');
      })
      .catch(() => setMembershipStatus('none'))
      .finally(() => setMembershipLoading(false));
  }, [challenge]);

  const detailLabels = useMemo(
    () => ({ locationFallbackLabel: t('challenges.locationFallback'), categoryFallbackLabel: t('challenges.categoryFallback') }),
    [t],
  );

  const requestedDay = Number(day ?? 1);
  const result = challenge ? toChallengeDetailViewModel(challenge, detailLabels) : null;
  const view = result?.ok ? result.value : null;

  const selectedDay = view?.days.find((item) => item.day === requestedDay) ?? null;
  const rawCycleDay = Array.isArray(challenge?.cycle_days)
    ? challenge.cycle_days.find((item) => Number(item.day_number) === requestedDay)
    : undefined;
  const exercises = useMemo(() => buildExerciseRows(rawCycleDay, t), [rawCycleDay, t]);

  // Tapping an exercise opens its own screen — everything the catalog knows about
  // it, not just the one-line description this row used to expand into. Keyed by
  // list index, since these rows have no stable id of their own.
  const { openExercise, openingKey } = useOpenExercise();

  // Activity Color System v2 — everything on this screen that was flat
  // `colors.primary` now resolves to this challenge's own accent instead
  // (hero card, "next in cycle" workout-day badge, exercise set counts,
  // Join button). Falls back to `colors.primary` itself (white) when the
  // challenge has no dominant category yet — see getChallengeAccentColor.
  // NOT applied to the loading-state spinner above: no challenge data
  // exists yet at that point, so there's nothing to resolve a color from.
  const accentColor = getChallengeAccentColor(challenge ? pickDominantActivityCategory(challenge) : null);

  // What comes next in the cycle: the next day and, when that is a rest day, the
  // routine after it as well — never a lone rest day.
  const upcomingDays = view ? getUpcomingDays(view.days, view.cycleLengthDays, requestedDay) : [];

  function handleShare() {
    if (!challenge || !selectedDay) return;
    Share.share({ message: t('challengeInfo.shareMessage', { name: `${challenge.name} — ${selectedDay.routineName}` }) }).catch(() => {});
  }

  if (loading) {
    return (
      <ScreenBackground variant="default">
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  // Nothing to show: a load error, or a rest day — which has no routine, and which
  // nothing in the app opens (a rest day's row does not navigate), so this is only
  // ever reached by a stale link.
  if (!view || !selectedDay || selectedDay.isRestDay) {
    return (
      <ScreenBackground variant="default" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
        {/* Keep the challenge's backdrop when there is a challenge to take a color
            from (skipped on a load error). */}
        {challenge && <ChallengeAccentBackdrop color={accentColor} />}
        <Row justify="space-between" align="center" style={styles.topBar}>
          <BackButton style={styles.backButton} />
          <View style={styles.iconButton} />
        </Row>
        <View style={styles.center}>
          <Text variant="header" tone="primary" align="center">
            {selectedDay?.isRestDay ? t('challengeRoutineDay.restDayTitle') : t('challengeRoutineDay.emptyTitle')}
          </Text>
          <Text variant="body" tone="secondary" align="center" style={styles.emptyMessage}>
            {selectedDay?.isRestDay ? t('challengeRoutineDay.restDayMessage') : t('challengeRoutineDay.emptyMessage')}
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="default" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
      <ChallengeAccentBackdrop color={accentColor} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: membershipStatus === 'none' ? spacing['2xl'] : insets.bottom + spacing.xl }}
      >
        <Row justify="space-between" align="center" style={styles.topBar}>
          <BackButton style={styles.backButton} />
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('challengeRoutineDay.shareA11y')}
          >
            <Icon name="share-outline" size={22} color={colors.paper} />
          </Pressable>
        </Row>

        <View style={styles.heroWrap}>
          <View style={[styles.hero, { backgroundColor: accentColor }]}>
            <Text variant="caption" weight="bold" inverse tone="secondary" style={styles.heroEyebrow}>
              {t('challengeRoutineDay.routineOfLabel', { current: requestedDay, total: view.cycleLengthDays })}
            </Text>
            <Text variant="title" inverse>{selectedDay.routineName}</Text>
            <Text variant="label" weight="medium" inverse style={styles.heroSubtitle}>
              {selectedDay.location}
            </Text>
          </View>
        </View>

        <View style={styles.tableSection}>
          <Row justify="space-between" style={styles.tableHeaderRow}>
            <Text variant="caption" tone="secondary" style={styles.tableHeaderExercise}>
              {t('challengeRoutineDay.exerciseColumnLabel')}
            </Text>
            <Text variant="caption" tone="secondary">{t('challengeRoutineDay.setsColumnLabel')}</Text>
            <Text variant="caption" tone="secondary" style={styles.tableHeaderRest}>
              {t('challengeRoutineDay.restColumnLabel')}
            </Text>
          </Row>

          {exercises.map((exercise, index) => (
            <View
              key={`${exercise.name}-${index}`}
              style={[styles.exerciseUnit, index < exercises.length - 1 && styles.exerciseRowDivider]}
            >
              <Pressable
                disabled={openingKey !== null}
                onPress={() => openExercise(exercise.catalogName, index)}
                accessibilityRole="button"
                accessibilityLabel={t('challengeRoutineDay.openExerciseA11y', { name: exercise.name })}
              >
                <Row justify="space-between" align="center" style={styles.exerciseRow}>
                  <Row align="center" gap="xs" style={styles.exerciseName}>
                    <Text variant="body" weight="regular" numberOfLines={1} style={styles.exerciseNameText}>
                      {exercise.name}
                    </Text>
                    {/* The way in to the exercise's screen: a chevron, or a spinner
                        on the row being looked up. */}
                    {openingKey === index ? (
                      <ActivityIndicator size="small" color={withAlpha(colors.paper, textOpacity.tertiary)} />
                    ) : (
                      <Icon
                        name="chevron-forward-outline"
                        size={EXERCISE_CHEVRON_SIZE}
                        color={withAlpha(colors.paper, textOpacity.tertiary)}
                      />
                    )}
                  </Row>
                  <Text variant="body" weight="bold" style={[styles.exerciseSets, { color: accentColor }]}>{exercise.setsLabel}</Text>
                  <Text variant="label" weight="medium" style={styles.tableHeaderRest}>{exercise.restLabel}</Text>
                </Row>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.notesSection}>
          <Text variant="label" weight="bold">{t('challengeRoutineDay.notesLabel')}</Text>
          <Text variant="body" style={styles.notesText}>
            {typeof rawCycleDay?.routine_description === 'string' && rawCycleDay.routine_description.trim()
              ? rawCycleDay.routine_description
              : selectedDay.routineName}
          </Text>
        </View>

        {upcomingDays.length > 0 && (
          <View style={[styles.nextSection, styles.upcomingList]}>
            {upcomingDays.map((upcoming, index) => (
              <UpcomingDayCard
                key={upcoming.day}
                day={upcoming}
                label={index === 0 ? t('challengeRoutineDay.nextInCycleLabel') : t('challengeRoutineDay.afterThatLabel')}
                accentColor={accentColor}
                onPress={() => router.push(`/challenge/${id}/routine/${upcoming.day}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {!membershipLoading && membershipStatus === 'none' && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Pressable
            onPress={joinPopup.show}
            style={({ pressed }) => [styles.joinButton, { backgroundColor: accentColor }, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('challenges.joinButtonA11y')}
          >
            <Text variant="body" weight="bold" style={styles.joinButtonText}>
              {t('challengeInfo.joinChallengeButton')}
            </Text>
          </Pressable>
        </View>
      )}

      <joinPopup.Component />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyMessage: {
    opacity: 1,
  },
  topBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  heroWrap: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
  },
  hero: {
    // backgroundColor set inline — this challenge's own accent color, see accentColor above.
    borderRadius: radius.big,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  heroEyebrow: {
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    color: colors.ink,
    opacity: 1,
  },
  tableSection: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
  },
  tableHeaderRow: {
    paddingBottom: spacing.sm,
  },
  tableHeaderExercise: {
    flex: 1,
  },
  tableHeaderRest: {
    width: 56,
    textAlign: 'right',
  },
  // Wraps one exercise's row — the divider lives here, on the whole unit, so it
  // sits directly above the NEXT exercise.
  exerciseUnit: {},
  exerciseRow: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  exerciseRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(colors.paper, 0.08),
  },
  // Wraps the name Text + the chevron that says the row opens the exercise.
  exerciseName: {
    flex: 1,
    minWidth: 0,
  },
  exerciseNameText: {
    flexShrink: 1,
  },
  exerciseSets: {
    // color set inline — this challenge's own accent color, see accentColor above.
    opacity: 1,
  },
  notesSection: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  notesText: {
    opacity: 1,
  },
  nextSection: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
  },
  // The rows of "what comes next" (see `UpcomingDayCard`), a comfortable gap apart.
  upcomingList: {
    gap: spacing.md,
  },
  bottomBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  joinButton: {
    height: 52,
    borderRadius: radius.big,
    // backgroundColor set inline — this challenge's own accent color, see accentColor above.
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: colors.ink,
    opacity: 1,
  },
});
