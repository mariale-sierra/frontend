import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  View,
} from 'react-native';
import { Stack as ExpoStack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/layout/screenBackground';
import { Stack } from '../../components/layout/stack';
import { Text } from '../../components/ui/text';
import { IconButton } from '../../components/ui/iconButton';
import { ActiveChallengeCard } from '../../components/challenge/list/ActiveChallengeCard';
import { CompletedChallengeCard } from '../../components/challenge/list/CompletedChallengeCard';
import type { ActiveChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import { getUserEnrolledChallenges } from '../../services/challenge/challenge.service';
import { toEnrolledChallengesViewModel } from '../../services/adapters';
import { colors, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
// Set to false (or delete this block) to use real backend data.
const USE_MOCK_DATA = true;
const MOCK_CHALLENGES: ActiveChallengeViewModel[] = [
  { challengeId: 'mock-1', title: '30-Day Strength Builder', day: 14, progressPercent: 47,  streakCount: 5, activityType: 'strength',      status: 'active'    },
  { challengeId: 'mock-2', title: 'Morning Cardio Blast',    day: 7,  progressPercent: 23,  streakCount: 3, activityType: 'cardioIntense', status: 'active'    },
  { challengeId: 'mock-3', title: 'Flexibility Foundation',  day: 21, progressPercent: 100, streakCount: 0, activityType: 'flexibility',  status: 'completed' },
  { challengeId: 'mock-4', title: 'Mindfulness Reset',       day: 14, progressPercent: 100, streakCount: 0, activityType: 'mindBody',     status: 'completed' },
  { challengeId: 'mock-5', title: 'Functional Power Week',   day: 4,  progressPercent: 28,  streakCount: 0, activityType: 'functional',   status: 'left'      },
  { challengeId: 'mock-6', title: 'Low Cardio Recovery',     day: 9,  progressPercent: 60,  streakCount: 0, activityType: 'cardioLow',    status: 'left'      },
];
// ─────────────────────────────────────────────────────────────────────────────

type ChallengeStatus = 'active' | 'completed' | 'left';

const TABS = [
  { key: 'active'    as ChallengeStatus, icon: 'flash-outline'           as const, activeIcon: 'flash'            as const },
  { key: 'completed' as ChallengeStatus, icon: 'checkmark-circle-outline' as const, activeIcon: 'checkmark-circle' as const },
  { key: 'left'      as ChallengeStatus, icon: 'close-circle-outline'    as const, activeIcon: 'close-circle'     as const },
] as const;

const ANIM_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
  useNativeDriver: false,
};

// tab height 48 + 4px padding top/bottom = 56
const FLOATING_BAR_HEIGHT = 56;

function groupByStatus(
  challenges: ActiveChallengeViewModel[],
): Record<ChallengeStatus, ActiveChallengeViewModel[]> {
  return {
    active:    challenges.filter((c) => c.status === 'active'),
    completed: challenges.filter((c) => c.status === 'completed'),
    left:      challenges.filter((c) => c.status === 'left'),
  };
}

export default function ActiveAll() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<ChallengeStatus>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grouped, setGrouped] = useState<Record<ChallengeStatus, ActiveChallengeViewModel[]>>({
    active: [],
    completed: [],
    left: [],
  });

  // One animated value per tab: 0 = inactive, 1 = active
  const anim0 = useRef(new Animated.Value(1)).current;
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const tabAnims = useRef([anim0, anim1, anim2]).current;

  // Pre-computed flex interpolations so they're stable across renders
  const flexAnims = useRef(
    tabAnims.map((a) => a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }))
  ).current;

  useEffect(() => {
    // ── MOCK DATA — remove the next 4 lines to use real backend data ──────────
    if (USE_MOCK_DATA) { setGrouped(groupByStatus(MOCK_CHALLENGES)); setLoading(false); return; }
    // ─────────────────────────────────────────────────────────────────────────
    getUserEnrolledChallenges()
      .then((res) => setGrouped(groupByStatus(toEnrolledChallengesViewModel(res ?? []))))
      .catch(() => setError(t('challenges.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  function switchTab(idx: number) {
    Animated.parallel(
      tabAnims.map((anim, i) =>
        Animated.timing(anim, { ...ANIM_CONFIG, toValue: i === idx ? 1 : 0 })
      )
    ).start();
    setActiveTab(TABS[idx].key);
  }

  const dayLabelBuilder   = (day: number)   => t('challenges.dayLabel',    { day });
  const streakLabelBuilder = (count: number) => t('challenges.streakLabel', { count });

  const tabTitles: Record<ChallengeStatus, string> = {
    active:    t('challenges.inProgress'),
    completed: t('challenges.completed'),
    left:      t('challenges.left'),
  };

  const barBottom    = spacing.lg + insets.bottom;
  const contentBottom = FLOATING_BAR_HEIGHT + barBottom + spacing.md;

  return (
    <ScreenBackground variant="challenges">
      <ExpoStack.Screen options={{ headerShown: false }} />

      {/* Back button */}
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
      </View>

      {/* Big title — changes with active tab */}
      <View style={styles.titleSection}>
        <Text variant="title">{tabTitles[activeTab]}</Text>
        <Text variant="body" tone="secondary">
          {grouped[activeTab].length} challenges
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: contentBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Stack gap="sm">
            {activeTab === 'active' && grouped.active.map((c) => (
              <ActiveChallengeCard
                key={c.challengeId}
                challenge={c}
                dayLabel={dayLabelBuilder(c.day)}
                statusLabel={streakLabelBuilder(c.streakCount)}
                layout="full"
                onPress={() => router.push(`/challenge/${c.challengeId}`)}
              />
            ))}
            {activeTab === 'completed' && grouped.completed.map((c) => (
              <CompletedChallengeCard
                key={c.challengeId}
                challenge={c}
                conqueredLabel={t('challenges.conquered')}
                completedLabel={t('challenges.completed')}
                onPress={() => router.push(`/challenge/${c.challengeId}`)}
              />
            ))}
            {activeTab === 'left' && grouped.left.map((c) => (
              <ActiveChallengeCard
                key={c.challengeId}
                challenge={c}
                dayLabel={dayLabelBuilder(c.day)}
                statusLabel={t('challenges.left')}
                layout="full"
                onPress={() => router.push(`/challenge/${c.challengeId}`)}
              />
            ))}
          </Stack>
        </ScrollView>
      )}

      {/* ── Floating pill tab bar ─────────────────────────────────────────── */}
      <View style={[styles.barWrapper, { bottom: barBottom }]}>
        <View style={styles.barContainer}>
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.key;
            const count    = grouped[tab.key].length;
            return (
              <Animated.View key={tab.key} style={{ flex: flexAnims[idx] }}>
                <Pressable onPress={() => switchTab(idx)} style={styles.tabPressable}>
                  {/* White pill that fades in for the active tab */}
                  <Animated.View style={[styles.tabPill, { opacity: tabAnims[idx] }]} />

                  {/* Icon + label (active) or icon + count (inactive) */}
                  <View style={styles.tabContent}>
                    <Ionicons
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={16}
                      color={isActive ? colors.textInverse : colors.primary}
                    />
                    {isActive ? (
                      <NativeText style={styles.tabLabel}>
                        {tabTitles[tab.key]}
                      </NativeText>
                    ) : (
                      count > 0 && (
                        <NativeText style={styles.tabCount}>{count}</NativeText>
                      )
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </ScreenBackground>
  );
}

const BAR_BG     = withAlpha(colors.surface,  0.88);
const BAR_BORDER = withAlpha(colors.primary,  0.10);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titleSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Floating bar ─────────────────────────────────────────────────────────
  barWrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  barContainer: {
    flexDirection: 'row',
    backgroundColor: BAR_BG,
    borderRadius: 9999,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: BAR_BORDER,
    // Elevated shadow — intentionally beyond theme.shadows.lg for the float effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  tabPressable: {
    flex: 1,
    height: 48,
    borderRadius: 9999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    borderRadius: 9999,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
  tabCount: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.primary,
    opacity: 0.6,
  },
});
