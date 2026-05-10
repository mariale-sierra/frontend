import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenBackground from '../../components/layout/screenBackground';
import { Text } from '../../components/ui/text';
import { colors, radius, spacing } from '../../constants/theme';
import { getMyChallenges } from '../../services/user/user.service';
import { getChallengeProgress } from '../../services/challenge/challenge.service';
import { submitWorkoutProgress } from '../../services/workout-log/workout-log.service';

export default function RestDay() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [challenges, setChallenges] = useState<Array<{ id: string; name: string }>>([]);
  const [progress, setProgress] = useState<{ currentDay?: number; totalDays: number; completedToday?: boolean } | null>(null);

  useEffect(() => {
    Promise.all([getMyChallenges(), getChallengeProgress()])
      .then(([items, currentProgress]) => {
        setChallenges(items.map((item) => ({ id: String(item.id), name: item.name })));
        setSelectedChallengeId((items[0] && String(items[0].id)) || '');
        setProgress(currentProgress);
      })
      .catch(() => setError('No se pudieron cargar tus challenges.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    if (!selectedChallengeId) {
      setError('Selecciona un challenge primero.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitWorkoutProgress({
        challengeId: selectedChallengeId,
        isRestDay: true,
        caption: caption.trim() || undefined,
        visibility: 'private',
      });
      router.push('/(add)/preview');
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message ?? 'No se pudo registrar el descanso.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.container}>
        <Text variant="title">Rest day</Text>
        <Text variant="body" tone="secondary">
          Este formulario usa el endpoint nuevo para registrar progreso sin imagen.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : error ? (
          <Text tone="secondary">{error}</Text>
        ) : (
          <>
            {progress ? (
              <View style={styles.infoCard}>
                <Text variant="caption" tone="secondary">Current progress</Text>
                <Text variant="subheader">Day {progress.currentDay ?? 0}/{progress.totalDays}</Text>
                <Text variant="body" tone="secondary">
                  {progress.completedToday ? 'Ya completaste progreso hoy.' : 'Aún no registraste progreso hoy.'}
                </Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text variant="subheader">Choose challenge</Text>
              <View style={styles.challengeList}>
                {challenges.map((challenge) => {
                  const selected = challenge.id === selectedChallengeId;
                  return (
                    <Pressable
                      key={challenge.id}
                      onPress={() => setSelectedChallengeId(challenge.id)}
                      style={({ pressed }) => [styles.challengeRow, selected && styles.challengeRowSelected, pressed && styles.pressed]}
                    >
                      <View style={styles.challengeDot} />
                      <Text style={styles.challengeName}>{challenge.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text variant="subheader">Caption</Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Optional note for the rest day"
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.input}
                multiline
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, submitting && styles.submitDisabled]}
            >
              <Text variant="body" style={styles.submitText}>
                {submitting ? 'Saving...' : 'Registrar descanso'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    gap: spacing.xs,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    gap: spacing.sm,
  },
  challengeList: {
    gap: spacing.xs,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  challengeRowSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  challengeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  challengeName: {
    flex: 1,
  },
  input: {
    minHeight: 96,
    borderRadius: radius.lg,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});