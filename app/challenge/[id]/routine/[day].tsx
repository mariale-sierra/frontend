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
import { colors, radius, spacing } from '../../../../constants/theme';
import { withAlpha } from '../../../../utils/color';
import { toTitleCase } from '../../../../utils/format';
import { toChallengeDetailViewModel } from '../../../../services/adapters/index';
import { getChallenge, joinChallenge } from '../../../../services/challenge/challenge.service';
import { getMyChallenges } from '../../../../services/user/user.service';
import { useConfirmationPopup } from '../../../../hooks/useConfirmationPopup';
import type { ChallengeContract, ChallengeCycleDayContract } from '../../../../types/challenge';

type MembershipStatus = 'creator' | 'joined' | 'none';

interface ExerciseRow {
  name: string;
  /** "4 × 12" / "3 × 45s" style — placeholder data (see the doc comment on PLACEHOLDER_METRICS below). */
  setsLabel: string;
  restLabel: string;
}

/**
 * Cycle-day exercises don't carry real set/rep/rest data in the current
 * backend response (`ChallengesService.getCycleDaySummaries()` only selects
 * `name`/`activity_type` — no sets/targets/metrics, unlike
 * `RoutineService.getTodayRoutine()`, which DOES join that data but for a
 * different endpoint). Flat placeholder numbers for every exercise until
 * that's wired up — see the skill's Open Items Tracker. Not varied per
 * exercise/category on purpose: inventing *specific*-looking numbers per
 * exercise would misrepresent them as real programmed data, which they
 * aren't.
 */
const PLACEHOLDER_SETS_LABEL = '3 × 10';
const PLACEHOLDER_REST_LABEL = '45s';

function buildExerciseRows(cycleDay: ChallengeCycleDayContract | undefined): ExerciseRow[] {
  const exercises = Array.isArray(cycleDay?.exercises) ? cycleDay.exercises : [];
  return exercises.map((exercise, index) => {
    const rawName = typeof exercise.name === 'string' && exercise.name.trim() ? exercise.name.trim() : `Exercise ${index + 1}`;
    return {
      // The shared exercise-library catalog stores names in all caps
      // ("HIP THRUST") — toTitleCase() normalizes that for display without
      // touching a name that's already reasonably cased. See its own doc
      // comment (utils/format.ts) for why this looked like a font bug at
      // first: shouty-uppercase text read as "unstyled" against the
      // wireframe's plain-case design, not an actual missing-font issue.
      name: toTitleCase(rawName),
      setsLabel: PLACEHOLDER_SETS_LABEL,
      restLabel: PLACEHOLDER_REST_LABEL,
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

  const joinPopup = useConfirmationPopup({
    type: 'join',
    challengeName: challenge?.name ?? t('challenges.fallbackName'),
    onConfirm: async () => {
      const challengeId = typeof id === 'string' ? id : '';
      if (!challengeId) return;
      try {
        await joinChallenge(challengeId);
        setMembershipStatus('joined');
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
  const exercises = useMemo(() => buildExerciseRows(rawCycleDay), [rawCycleDay]);

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
          <View style={styles.hero}>
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
            <Row
              key={`${exercise.name}-${index}`}
              justify="space-between"
              align="center"
              style={[styles.exerciseRow, index < exercises.length - 1 && styles.exerciseRowDivider]}
            >
              <Text variant="body" weight="regular" numberOfLines={1} style={styles.exerciseName}>{exercise.name}</Text>
              <Text variant="body" weight="bold" style={styles.exerciseSets}>{exercise.setsLabel}</Text>
              <Text variant="label" weight="medium" style={styles.tableHeaderRest}>{exercise.restLabel}</Text>
            </Row>
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

        {nextDaySummary && (
          <View style={styles.nextSection}>
            <Pressable
              onPress={() => router.push(`/challenge/${id}/routine/${nextDaySummary.day}`)}
              style={({ pressed }) => [styles.nextCard, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <View style={[styles.nextBadge, { backgroundColor: nextDaySummary.isRestDay ? colors.rest : colors.primary }]}>
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
            style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}
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
    backgroundColor: colors.primary,
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
  exerciseRow: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  exerciseRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(colors.paper, 0.08),
  },
  exerciseName: {
    flex: 1,
    minWidth: 0,
  },
  exerciseSets: {
    color: colors.primary,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: colors.ink,
    opacity: 1,
  },
});
