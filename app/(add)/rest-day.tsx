import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack, safeBackTimes } from '../../utils/navigation';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { RestDayScreenBackground } from '../../components/layout/restDayScreenBackground';
import { IconButton } from '../../components/ui/iconButton';
import { RestDayContent } from '../../components/add/restDay/RestDayContent';
import { RestDayAlreadyLogged } from '../../components/add/restDay/RestDayAlreadyLogged';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getChallengeProgress } from '../../services/challenge/challenge.service';
import { submitWorkoutProgress } from '../../services/workout-log/workout-log.service';
import { useMetricsEntryStore } from '../../store/metricsEntryStore';
import { invalidateChallengeProgressCache } from '../../hooks/useChallengeProgress';
import { useUploadSuccessStore } from '../../store/uploadSuccessStore';

export default function RestDay() {
  const router = useRouter();
  const { t } = useTranslation();
  const selectedChallengeId = useMetricsEntryStore((state) => state.selectedChallengeId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Real bug, fixed 2026-08-29, per explicit report ("it made other
    // challenges access a weird none approved rest days screen that says I
    // cant log in"): this called getChallengeProgress() with NO challengeId
    // at all, even though `selectedChallengeId` was already sitting right
    // above — the backend's own fallback for "no id passed" is "the user's
    // most recently joined active challenge" (ChallengesService.getProgress),
    // not the challenge the user actually opened this screen for. So this
    // screen was checking whether TODAY was already logged for some
    // unrelated challenge, and would incorrectly show the "already logged"
    // screen for a challenge that hadn't been touched today at all, purely
    // because a DIFFERENT (often older/legacy) challenge happened to be the
    // most-recently-joined one and already had today's progress logged.
    getChallengeProgress(selectedChallengeId ?? undefined)
      .then((progress) => setCompletedToday(progress?.completedToday ?? false))
      .catch(() => setCompletedToday(false))
      .finally(() => setLoading(false));
  }, [selectedChallengeId]);

  async function handleJustToday() {
    if (!selectedChallengeId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitWorkoutProgress({
        challengeId: selectedChallengeId,
        isRestDay: true,
        visibility: 'private',
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? t('restDay.saveFailedMessage'));
      setSubmitting(false);
      return;
    }

    // Saved server-side at this point — nothing below is allowed to
    // surface as a save failure (same fix as camera.tsx's handleConfirm,
    // applied here 2026-08-29 for the same latent bug: a post-save nav
    // hiccup used to be caught by the same try/catch as the actual submit
    // and misreported as a failed save).
    invalidateChallengeProgressCache();
    useUploadSuccessStore.getState().show();
    setSubmitting(false);
    try {
      // NOT router.dismissAll() — see camera.tsx's handleConfirm for the
      // full explanation (fixed 2026-08-29, same bug: dismissAll()'s
      // POP_TO_TOP only clears (add)'s own nested stack, landing back on
      // metrics.tsx instead of actually closing the modal). metrics.tsx
      // reaches this screen via router.push() too, so it's the same
      // always-exactly-2-deep case — two back() calls pop rest-day then
      // metrics, and the second bubbles up to close the (add) modal itself.
      safeBackTimes(2);
    } catch (navError) {
      console.error('[RestDay] closing the (add) modal failed after a successful save:', navError);
    }
  }

  function handlePlanRestDays() {
    router.push('/(add)/plan-rest-days');
  }

  if (loading) {
    return (
      <ScreenBackground variant="top">
        <View style={styles.screen}>
          <View style={styles.header}>
            <IconButton
              name="chevron-back-outline"
              onPress={() => safeBack()}
              size={28}
              iconSize={18}
              variant="ghost"
              accessibilityRole="button"
              accessibilityLabel={t('metrics.accessibilityBack')}
            />
          </View>
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={withAlpha(colors.paper, textOpacity.secondary)} />
          </View>
        </View>
      </ScreenBackground>
    );
  }

  if (completedToday) {
    return (
      <ScreenBackground variant="top">
        <View style={styles.screen}>
          <View style={styles.header}>
            <IconButton
              name="chevron-back-outline"
              onPress={() => safeBack()}
              size={28}
              iconSize={18}
              variant="ghost"
              accessibilityRole="button"
              accessibilityLabel={t('metrics.accessibilityBack')}
            />
          </View>
          <RestDayAlreadyLogged
            onBack={() => safeBack()}
            onPlanRestDays={handlePlanRestDays}
          />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <RestDayScreenBackground>
      <View style={styles.screen}>
        <View style={styles.restChoiceHeader}>
          <IconButton
            name="close-outline"
            onPress={() => safeBack()}
            size={44}
            iconSize={24}
            variant="ghost"
            iconColor={colors.ink}
            style={styles.restChoiceIconButton}
            accessibilityRole="button"
            accessibilityLabel={t('metrics.accessibilityBack')}
          />
        </View>
        <RestDayContent
          onJustToday={handleJustToday}
          onPlanRestDays={handlePlanRestDays}
          loading={submitting}
          error={error}
        />
      </View>
    </RestDayScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  // Rest-Or-Plan-28C wireframe's own tighter header spacing — different from
  // the other two branches above (unchanged, no wireframe for those states).
  restChoiceHeader: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  restChoiceIconButton: {
    marginLeft: -spacing.sm,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
