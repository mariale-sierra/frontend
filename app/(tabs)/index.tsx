import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import ScreenBackground from '../../components/layout/screenBackground';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { ActiveChallengeSection } from '../../components/home/ActiveChallengeSection';
import { getChallengeProgress } from '../../services/challenge/challenge.service';
import { getHomeChallengesSorted } from '../../services/adapters/homeAdapter';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';
import { colors, radius, spacing } from '../../constants/theme';
import { hoursUntilMidnight } from '../../utils/time';
import { getMyChallenges } from '../../services/user/user.service';
const SHIMMER_BASE = colors.surface;
const SHIMMER_HIGHLIGHT = colors.surfaceHighlight;

function Bone({ style }: { style: object }) {
  return (
    <ShimmerPlaceholder
      LinearGradient={LinearGradient}
      shimmerColors={[SHIMMER_BASE, SHIMMER_HIGHLIGHT, SHIMMER_BASE]}
      style={style}
    />
  );
}

const ENABLE_HOME_MOCK = true;

export default function Home() {
  const { username } = useAuth();
  const insets = useSafeAreaInsets();

  const [challenges, setChallenges] = useState<HomeActiveChallengeViewModel[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  Promise.all([getMyChallenges(), getChallengeProgress()])
    .then(([rawChallenges, progress]) => {
      setChallenges(getHomeChallengesSorted(rawChallenges));
      setChallengeProgress(progress);
    })
    .catch(() => {
      setChallenges([]);
      setChallengeProgress(null);
    })
    .finally(() => setLoading(false));
}, []);

  const hoursLeft = hoursUntilMidnight();

  return (
    <ScreenBackground
      variant="default"
      contentStyle={[styles.screen, { paddingTop: insets.top + spacing.md }]}
    >
      
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Icon name="person" size={20} color={colors.textPrimary} />
        </View>
        <Text variant="body" style={styles.username}>
          {username ?? ''}
        </Text>
      </View>

      <View style={styles.challengeArea}>
        
        {challengeProgress && (
          <View style={styles.progressCard}>
            <Text variant="caption" tone="secondary">
              Current challenge
            </Text>
            <Text variant="subheader">
              {challengeProgress.challenge?.name ?? 'Active progress'}
            </Text>
            <Text variant="body" tone="secondary">
              Day {challengeProgress.currentDay ?? 0}/{challengeProgress.totalDays}
              {challengeProgress.completedToday ? ' · Completed today' : ''}
            </Text>
          </View>
        )}

     
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.textPrimary} />
          </View>
        ) : challenges.length > 0 ? (
          <ActiveChallengeSection challenges={challenges} hoursLeft={hoursLeft} />
        ) : (
          <View style={styles.center}>
            <Text>No challenges available</Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.cardList}>
          <Bone style={styles.card} />
          <Bone style={styles.card} />
          <Bone style={styles.card} />
        </View>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontWeight: '600',
  },
  challengeArea: {
    marginTop: spacing['2xl'] + spacing.lg,
    gap: spacing.md,
  },
  progressCard: {
    marginHorizontal: spacing.lg,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['2xl'],
  },
  cardList: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing['2xl'],
  },
  card: {
    width: '100%',
    height: 100,
    borderRadius: radius.xl,
  },
});