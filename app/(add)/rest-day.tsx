import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenBackground from '../../components/layout/screenBackground';
import { IconButton } from '../../components/ui/iconButton';
import { RestDayContent } from '../../components/add/restDay/RestDayContent';
import { RestDayAlreadyLogged } from '../../components/add/restDay/RestDayAlreadyLogged';
import { colors, spacing } from '../../constants/theme';
import { getChallengeProgress } from '../../services/challenge/challenge.service';
import { submitWorkoutProgress } from '../../services/workout-log/workout-log.service';
import { useMetricsEntryStore } from '../../store/metricsEntryStore';

export default function RestDay() {
  const router = useRouter();
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
      router.push('/(add)/preview');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not save your rest day.');
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
            name="chevron-back"
            onPress={() => router.back()}
            size={28}
            iconSize={18}
            variant="ghost"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.textSecondary} />
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
