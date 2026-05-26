import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useChallengeProgress } from '../../hooks/useChallengeProgress';
import ScreenBackground from '../../components/layout/screenBackground';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { ActiveChallengeSection } from '../../components/home/ActiveChallengeSection';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';
import { colors, radius, spacing } from '../../constants/theme';
import { hoursUntilMidnight } from '../../utils/time';

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

// REMOVE_MOCK_START: delete once all three badge states are validated in production
// Note: TimeBadge only renders when hoursLeft > 0 (i.e. before midnight).
const MOCK_BADGE_CHALLENGES: HomeActiveChallengeViewModel[] = [
  { challengeId: 'mock-time',  title: 'Iron Will',         currentDay: 14, totalDays: 75, isTodayCompleted: false, isCompleted: false, activityType: 'strength',     isRestDay: false },
  { challengeId: 'mock-done',  title: 'Thirty Day Flex',   currentDay: 30, totalDays: 30, isTodayCompleted: true,  isCompleted: true,  activityType: 'flexibility',  isRestDay: false },
  { challengeId: 'mock-rest',  title: 'Morning Cardio 21', currentDay: 8,  totalDays: 21, isTodayCompleted: false, isCompleted: false, activityType: 'cardioLow',    isRestDay: true  },
];
// REMOVE_MOCK_END

export default function Home() {
  const { username } = useAuth();
  const insets = useSafeAreaInsets();
  const { challenge: activeChallenge, loading } = useChallengeProgress();

  const hoursLeft = hoursUntilMidnight();
  const challenges: HomeActiveChallengeViewModel[] = activeChallenge
    ? [activeChallenge]
    : [];

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
        {loading ? (
          <View style={styles.cardList}>
            <Bone style={styles.card} />
            <Bone style={styles.card} />
            <Bone style={styles.card} />
          </View>
        ) : challenges.length > 0 ? (
          <ActiveChallengeSection challenges={[...MOCK_BADGE_CHALLENGES, ...challenges]} hoursLeft={hoursLeft} />
        ) : (
          <View style={styles.center}>
            <Text>No challenges available</Text>
          </View>
        )}
      </View>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['2xl'],
  },
  cardList: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  card: {
    width: '100%',
    height: 100,
    borderRadius: radius.xl,
  },
});
