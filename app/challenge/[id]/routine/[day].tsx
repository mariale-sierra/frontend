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
import { colors, radius, spacing, textOpacity } from '../../../../constants/theme';
import { withAlpha } from '../../../../utils/color';
import { toTitleCase } from '../../../../utils/format';
import { toChallengeDetailViewModel } from '../../../../services/adapters/index';
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
import { useErrorNotificationStore } from '../../../../store/errorNotificationStore';
import type { ChallengeContract, ChallengeCycleDayContract, ChallengeExerciseSetContract, ChallengeExerciseTargetContract } from '../../../../types/challenge';
import type { TFunction } from 'i18next';

type MembershipStatus = 'creator' | 'joined' | 'none';

interface ExerciseRow {
  name: string;
  /** "4 × 12" / "3 × 45s" style. */
  setsLabel: string;
  restLabel: string;
  /** Catalog exercise description — undefined until `getCycleDaySummaries()`
   * returns it (see `ChallengeExerciseContract.description`'s own doc
   * comment) or for the rare exercise with a genuinely blank one. Presence
   * of this field, not any separate flag, is what shows the row's
   * expand/collapse chevron below — no description, no toggle. */
  description?: string;
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

    const description = typeof exercise.description === 'string' && exercise.description.trim() ? exercise.description.trim() : undefined;

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
      description,
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

  // Per-row description expand/collapse (2026-08-30, new). Keyed by list
  // index rather than exercise id since these rows have no stable id of
  // their own. Reset on day change (via "Next in the cycle") so an
  // expanded row on today's list doesn't carry over onto tomorrow's,
  // which reuses this same mounted screen instance for a new `day` param.
  const [expandedExerciseIndexes, setExpandedExerciseIndexes] = useState<Set<number>>(new Set());
  useEffect(() => {
    setExpandedExerciseIndexes(new Set());
  }, [requestedDay]);

  function toggleExerciseDescription(index: number) {
    setExpandedExerciseIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  // Activity Color System v2 — everything on this screen that was flat
  // `colors.primary` now resolves to this challenge's own accent instead
  // (hero card, "next in cycle" workout-day badge, exercise set counts,
  // Join button). Falls back to `colors.primary` itself (white) when the
  // challenge has no dominant category yet — see getChallengeAccentColor.
  // NOT applied to the loading-state spinner above: no challenge data
  // exists yet at that point, so there's nothing to resolve a color from.
  const accentColor = getChallengeAccentColor(challenge ? pickDominantActivityCategory(challenge) : null);

  const nextDay = view && view.cycleLengthDays > 0 ? (requestedDay % view.cycleLengthDays) + 1 : null;
  const nextDaySummary = nextDay != null ? view?.days.find((item) => item.day === nextDay) ?? null : null;

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

  if (!view || !selectedDay || selectedDay.isRestDay) {
    return (
      <ScreenBackground variant="default" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
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

          {exercises.map((exercise, index) => {
            const hasDescription = exercise.description != null;
            const isExpanded = hasDescription && expandedExerciseIndexes.has(index);

            return (
              <View
                key={`${exercise.name}-${index}`}
                style={[styles.exerciseUnit, index < exercises.length - 1 && styles.exerciseRowDivider]}
              >
                <Pressable
                  disabled={!hasDescription}
                  onPress={() => toggleExerciseDescription(index)}
                  accessibilityRole={hasDescription ? 'button' : undefined}
                  accessibilityLabel={
                    hasDescription ? t('challengeRoutineDay.exerciseDescriptionA11y', { name: exercise.name }) : undefined
                  }
                >
                  <Row justify="space-between" align="center" style={styles.exerciseRow}>
                    <Row align="center" gap="xs" style={styles.exerciseName}>
                      <Text variant="body" weight="regular" numberOfLines={1} style={styles.exerciseNameText}>
                        {exercise.name}
                      </Text>
                      {hasDescription && (
                        <Icon
                          name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                          size={14}
                          color={withAlpha(colors.paper, textOpacity.tertiary)}
                        />
                      )}
                    </Row>
                    <Text variant="body" weight="bold" style={[styles.exerciseSets, { color: accentColor }]}>{exercise.setsLabel}</Text>
                    <Text variant="label" weight="medium" style={styles.tableHeaderRest}>{exercise.restLabel}</Text>
                  </Row>
                </Pressable>

                {isExpanded && (
                  <Text variant="body" tone="secondary" size="sm" style={styles.exerciseDescription}>
                    {exercise.description}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.notesSection}>
          <Text variant="label" weight="bold">{t('challengeRoutineDay.notesLabel')}</Text>
          <Text variant="body" style={styles.notesText}>
            {typeof rawCycleDay?.routine_description === 'string' && rawCycleDay.routine_description.trim()
              ? rawCycleDay.routine_description
              : selectedDay.routineName}
          </Text>
        </View>

        {nextDaySummary && (
          <View style={styles.nextSection}>
            <Pressable
              onPress={() => router.push(`/challenge/${id}/routine/${nextDaySummary.day}`)}
              style={({ pressed }) => [styles.nextCard, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <View style={[styles.nextBadge, { backgroundColor: nextDaySummary.isRestDay ? colors.rest : accentColor }]}>
                <Text variant="label" weight="bold" style={styles.nextBadgeText}>{nextDaySummary.day}</Text>
              </View>
              <View style={styles.nextTextColumn}>
                <Text variant="caption" tone="secondary">{t('challengeRoutineDay.nextInCycleLabel')}</Text>
                <Text
                  variant="body"
                  weight="bold"
                  numberOfLines={1}
                  style={nextDaySummary.isRestDay ? styles.nextTitleRest : styles.nextTitle}
                >
                  {nextDaySummary.isRestDay ? t('challengeInfo.restDayLabel') : nextDaySummary.routineName}
                </Text>
              </View>
              <Icon name="chevron-forward-outline" size={18} color={colors.paper} />
            </Pressable>
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
  // Wraps one exercise's row + its (optional) expanded description — the
  // divider now lives here, on the whole unit, not just the row, so it
  // still sits directly above the NEXT exercise regardless of whether this
  // one is expanded.
  exerciseUnit: {},
  exerciseRow: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  exerciseRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(colors.paper, 0.08),
  },
  // Wraps the name Text + its expand/collapse chevron (only rendered for an
  // exercise with a real description — see `hasDescription` in the JSX).
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
  // Description toggle (2026-08-30, new) — no horizontal padding of its own
  // since it already lines up with the exercise name above it (both start
  // at `tableSection`'s own left edge); `paddingBottom` matches `exerciseRow`'s
  // own vertical rhythm so the divider below sits the same distance away
  // whether this exercise is expanded or not.
  exerciseDescription: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
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
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  nextBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nextBadgeText: {
    color: colors.ink,
    opacity: 1,
  },
  nextTextColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nextTitle: {
    opacity: 1,
  },
  nextTitleRest: {
    color: colors.rest,
    opacity: 1,
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
