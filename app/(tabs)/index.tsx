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
import { getChallenges } from '../../services/challenge/challenge.service';
import { getHomeChallengesSorted } from '../../services/adapters/homeAdapter';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';
// REMOVE_MOCK_START: delete when backend provides active challenge data.
import { buildMockHomeChallenges } from '../../services/mocks/homeMock';
// REMOVE_MOCK_END
import { colors, radius, spacing } from '../../constants/theme';

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
import { hoursUntilMidnight } from '../../utils/time';

// REMOVE_MOCK_START: set to false when backend is ready.
const ENABLE_HOME_MOCK = true;
// REMOVE_MOCK_END

export default function Home() {
  const { username } = useAuth();
  const insets = useSafeAreaInsets();
  const [challenges, setChallenges] = useState<HomeActiveChallengeViewModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChallenges()
      .then((raw) => {
        const sorted = getHomeChallengesSorted(raw);
        // REMOVE_MOCK_START
        setChallenges(sorted.length > 0 ? sorted : ENABLE_HOME_MOCK ? buildMockHomeChallenges() : []);
        // REMOVE_MOCK_END
      })
      .catch(() => {
        // REMOVE_MOCK_START
        if (ENABLE_HOME_MOCK) setChallenges(buildMockHomeChallenges());
        // REMOVE_MOCK_END
      })
      .finally(() => setLoading(false));
  }, []);

  const hoursLeft = hoursUntilMidnight();

  return (
    <ScreenBackground variant="default" contentStyle={[styles.screen, { paddingTop: insets.top + spacing.md }]}> 
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Icon name="person" size={20} color={colors.textPrimary} />
        </View>
        <Text variant="body" style={styles.username}>{username ?? ''}</Text>
      </View>

      <View style={styles.challengeArea}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.textPrimary} />
          </View>
        ) : challenges.length > 0 ? (
          <ActiveChallengeSection challenges={challenges} hoursLeft={hoursLeft} />
        ) : null}
      </View>

      <View style={styles.cardList}>
        <Bone style={styles.card} />
        <Bone style={styles.card} />
        <Bone style={styles.card} />
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
