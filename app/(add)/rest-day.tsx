import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
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
    getChallengeProgress()
      .then((progress) => setCompletedToday(progress?.completedToday ?? false))
      .catch(() => setCompletedToday(false))
      .finally(() => setLoading(false));
  }, []);

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
      invalidateChallengeProgressCache();
      // See camera.tsx's handleConfirm for why this dismisses the whole
      // modal stack + shows the global success popup instead of routing to
      // a dedicated "preview" screen.
      useUploadSuccessStore.getState().show();
      router.dismissAll();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? t('restDay.saveFailedMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  function handlePlanRestDays() {
    router.push('/(add)/plan-rest-days');
  }

  return (
    <ScreenBackground variant="top">
      <View style={styles.screen}>
        <View style={styles.header}>
          <IconButton
            name="chevron-back-outline"
            onPress={() => router.back()}
            size={28}
            iconSize={18}
            variant="ghost"
            accessibilityRole="button"
            accessibilityLabel={t('metrics.accessibilityBack')}
          />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={withAlpha(colors.paper, textOpacity.secondary)} />
          </View>
        ) : completedToday ? (
          <RestDayAlreadyLogged
            onBack={() => router.back()}
            onPlanRestDays={handlePlanRestDays}
          />
        ) : (
          <RestDayContent
            onJustToday={handleJustToday}
            onPlanRestDays={handlePlanRestDays}
            loading={submitting}
            error={error}
          />
        )}
      </View>
    </ScreenBackground>
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
