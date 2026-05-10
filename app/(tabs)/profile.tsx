import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors } from '../../constants/theme';
import { Text } from '../../components/ui/text';
import { Icon } from '../../components/ui/icon';
import { useRouter } from 'expo-router';
import { getMe } from '../../services/user/user.service';
import { getMyChallenges } from '../../services/user/user.service';
import { getChallengeProgress } from '../../services/challenge/challenge.service';
import type { ChallengeContract } from '../../types/challenge';
import type { UserProfileContract } from '../../types/user';
import { toEnrolledChallengesViewModel } from '../../services/adapters';
import { useAuth } from '../../hooks/useAuth';
import { radius, spacing } from '../../constants/theme';
import { getHomeChallengesSorted } from '../../services/adapters/homeAdapter';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text variant="caption" tone="secondary">{label}</Text>
      <Text variant="subheader">{value}</Text>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { username: sessionUsername } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfileContract | null>(null);
  const [challenges, setChallenges] = useState<ChallengeContract[]>([]);
  const [progress, setProgress] = useState<{ currentDay?: number; totalDays: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getMyChallenges(), getChallengeProgress()])
      .then(([me, myChallenges, challengeProgress]) => {
        setProfile(me);
        setChallenges(myChallenges);
        setProgress(challengeProgress);
      })
      .catch(() => setError('No se pudieron cargar tus datos.'))
      .finally(() => setLoading(false));
  }, []);

  const activeChallenges = getHomeChallengesSorted(challenges).filter((item) => !item.isCompleted).length;

  return (
    <ScreenBackground variant="challenges" applyTopInset={false}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}> 
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text tone="secondary">{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroRow}>
              <View style={styles.avatar}>
                <Icon name="person" size={28} color={colors.textPrimary} />
              </View>

              <View style={styles.heroText}>
                <Text variant="title">{profile?.username ?? sessionUsername ?? 'Profile'}</Text>
                <Text variant="body" tone="secondary">{profile?.email ?? 'Sin email disponible'}</Text>
                <View style={styles.heroMeta}>
                  <Text style={styles.heroBadge}>{profile?.is_active ? 'Activo' : 'Inactivo'}</Text>
                  <Text style={styles.heroBadge}>{progress ? `Día ${progress.currentDay ?? 0}/${progress.totalDays}` : 'Sin progreso'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="Challenges" value={String(challenges.length)} />
              <StatCard label="Active" value={String(activeChallenges)} />
              <StatCard label="Current day" value={progress ? String(progress.currentDay ?? 0) : '--'} />
              <StatCard label="Total days" value={progress ? String(progress.totalDays) : '--'} />
            </View>

            <View style={styles.section}>
              <Text variant="subheader">My challenges</Text>
              <View style={styles.challengeList}>
                {challenges.length > 0 ? challenges.map((challenge) => (
                  <Pressable
                    key={String(challenge.id)}
                    onPress={() => router.push(`/challenge/${challenge.id}`)}
                    style={({ pressed }) => [styles.challengeRow, pressed && styles.pressed]}
                  >
                    <View style={styles.challengeDot} />
                    <View style={styles.challengeText}>
                      <Text variant="body">{challenge.name}</Text>
                      <Text variant="caption" tone="secondary">
                        {challenge.duration_days ?? '--'} days
                      </Text>
                    </View>
                  </Pressable>
                )) : (
                  <Text tone="secondary">Todavía no tienes challenges unidos.</Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  center: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  heroBadge: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  challengeList: {
    gap: spacing.sm,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
  },
  challengeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  challengeText: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.84,
  },
});
