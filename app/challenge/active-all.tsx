import { useCallback, useRef, useState } from 'react';
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
import { Stack as ExpoStack, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/layout/screenBackground';
import { Stack } from '../../components/layout/stack';
import { Text } from '../../components/ui/text';
import { IconButton } from '../../components/ui/iconButton';
import { ActiveChallengeCard } from '../../components/challenge/list/ActiveChallengeCard';
import { CompletedChallengeCard } from '../../components/challenge/list/CompletedChallengeCard';
import { useChallengeCompletion } from '../../hooks/useConfirmationPopup';
import type { ActiveChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import { getMyChallenges } from '../../services/user/user.service';
import { toEnrolledChallengesViewModel } from '../../services/adapters';
import { colors, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

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

  // Challenge completion notification
  const handleCompletionDismiss = useCallback(() => {
    // Refresh challenges after user sees completion notification
    getMyChallenges()
      .then((res) => setGrouped(groupByStatus(toEnrolledChallengesViewModel(res ?? []))))
      .catch(() => setError(t('challenges.loadError')));
  }, [t]);

  const completion = useChallengeCompletion({ onDismiss: handleCompletionDismiss });

  const shownCompletions = useRef(new Set<string>());

  // One animated value per tab: 0 = inactive, 1 = active
  const anim0 = useRef(new Animated.Value(1)).current;
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const tabAnims = useRef([anim0, anim1, anim2]).current;

  // Pre-computed flex interpolations so they're stable across renders
  const flexAnims = useRef(
    tabAnims.map((a) => a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }))
  ).current;

  const { show: showCompletion } = completion;

  // Refetches on focus (not just on mount) so leaving/completing a challenge
  // elsewhere and coming back here shows the up-to-date list instead of a
  // stale snapshot from whenever this screen first mounted.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMyChallenges()
        .then((res) => {
          if (!active) return;
          const challenges = toEnrolledChallengesViewModel(res ?? []);
          setGrouped(groupByStatus(challenges));

          // Check for newly completed challenges and show notification
          challenges.forEach((c) => {
            if (c.status === 'completed' && !shownCompletions.current.has(c.challengeId)) {
              showCompletion({
                challengeId: c.challengeId,
                challengeName: c.title,
                duration: `${c.day} days`,
                completedAt: new Date(),
              });
              shownCompletions.current.add(c.challengeId);
            }
          });
        })
        .catch(() => {
          if (active) setError(t('challenges.loadError'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [t, showCompletion]),
  );

  function switchTab(idx: number) {
    Animated.parallel(
      tabAnims.map((anim, i) =>
        Animated.timing(anim, { ...ANIM_CONFIG, toValue: i === idx ? 1 : 0 })
      )
    ).start();
    setActiveTab(TABS[idx].key);
  }

  const streakLabelBuilder = (count: number) => t('challenges.streakLabel', { count });
  const openChallengeProgress = (challengeId: string) => router.push(`/challenge/${challengeId}/progress`);
  const openChallengeDetail = (challengeId: string) => router.push(`/challenge/${challengeId}`);

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
                statusLabel={streakLabelBuilder(c.streakCount)}
                layout="full"
                onPress={() => openChallengeProgress(c.challengeId)}
              />
            ))}
            {activeTab === 'completed' && grouped.completed.map((c) => (
              <CompletedChallengeCard
                key={c.challengeId}
                challenge={c}
                conqueredLabel={t('challenges.conquered')}
                completedLabel={t('challenges.completed')}
                onPress={() => openChallengeDetail(c.challengeId)}
              />
            ))}
            {activeTab === 'left' && grouped.left.map((c) => (
              <ActiveChallengeCard
                key={c.challengeId}
                challenge={c}
                statusLabel={t('challenges.left')}
                layout="full"
                onPress={() => openChallengeDetail(c.challengeId)}
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

      {/* Challenge Completion Notification */}
      <completion.Component />
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
