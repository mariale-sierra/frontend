import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityScrollGradient from '../../../components/layout/activityScrollGradient';
import ChallengeHeader from '../../../components/challengesInfo/challengeHeader';
import ChallengeRoutineList from '../../../components/challengesInfo/challengeRoutineList';
import { CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar } from '../../../components/create';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { colors, spacing } from '../../../constants/theme';
import { getChallenge } from '../../../services/challenge/challenge.service';
import { toChallengeDetailViewModel } from '../../../services/adapters/index';
// REMOVE_MOCK_START: delete this import when backend payload is ready.
import { buildMockChallengeDetailViewModel } from '../../../services/mocks/challengeDetailMock';
// REMOVE_MOCK_END
import type { ChallengeContract } from '../../../types/challenge';
import { useTranslation } from 'react-i18next';

// REMOVE_MOCK_START: set to false (or delete block) when backend provides complete challenge detail data.
const ENABLE_CHALLENGE_DETAIL_MOCK = true;
// REMOVE_MOCK_END

export default function ChallengeDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    getChallenge(id)
      .then(setChallenge)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.center}>
          <ActivityIndicator color="#ffffff" />
        </View>
      </View>
    );
  }

  if (error || !challenge) {
    return null;
  }

  const challengeViewResult = toChallengeDetailViewModel(challenge);

  // REMOVE_MOCK_START: fallback preview mode for UI validation before backend fields are available.
  const challengeView = challengeViewResult.ok
    ? challengeViewResult.value
    : ENABLE_CHALLENGE_DETAIL_MOCK
      ? buildMockChallengeDetailViewModel()
      : null;
  // REMOVE_MOCK_END

  if (!challengeView) {
    return (
      <View style={styles.missingScreen}>
        <View style={styles.missingBlock}>
          <Text variant="title" style={styles.missingTitle}>Challenge data is incomplete</Text>
          <Text style={styles.missingSubtitle}>
            The design requires backend-provided fields. Add these to the challenge payload/database:
          </Text>
          {challengeViewResult.missingData.map((item) => (
            <Text key={`${item.field}-${item.requirement}`} style={styles.missingItem}>
              • {item.field}: {item.requirement}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ActivityScrollGradient activityType={challengeView.dominantActivity} style={styles.gradientContent}>
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
            <View style={styles.topLeftRow}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={12}
              >
                <Icon name="chevron-back" size={22} color={colors.textPrimary} />
              </Pressable>

              <Text variant="caption" style={styles.authorTopLabel}>
                By {t('challenges.memberAuthor')}
              </Text>
            </View>

            <View style={styles.topRightRow}>
              <Pressable
                style={({ pressed }) => [styles.saveIconButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Save challenge"
                hitSlop={12}
              >
                <Icon name="bookmark-outline" size={20} color={colors.textPrimary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.saveIconButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Challenge options"
                hitSlop={12}
              >
                <Icon name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          <ChallengeHeader
            challenge={{
              label: challengeView.title,
              description: challengeView.description,
              locations: challengeView.locations,
              activityBadges: challengeView.activities,
            }}
            detail={{
              days: challengeView.durationDays,
              membersJoined: challengeView.membersJoined,
            }}
          />
          <ChallengeRoutineList
            routine={challengeView.days}
            onPressDay={(day) => router.push(`/challenge/${id}/routine/${day}`)}
          />
        </ActivityScrollGradient>
      </ScrollView>

      <CreateFlowFixedBottomBar bottomInset={Math.max(insets.bottom, spacing.lg)} topPadding={spacing.md}>
        <CreateChallengePrimaryActionButton
          label="Join Challenge"
          accessibilityLabel="Join challenge"
        />
      </CreateFlowFixedBottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    backgroundColor: '#000000',
  },
  gradientContent: {
    minHeight: '100%',
    paddingBottom: spacing['2xl'] + 132,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorTopLabel: {
    color: colors.textPrimary,
    opacity: 0.9,
  },
  backButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIconButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  missingScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  missingBlock: {
    gap: spacing.sm,
  },
  missingTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  missingSubtitle: {
    opacity: 0.85,
    lineHeight: 21,
  },
  missingItem: {
    opacity: 0.9,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.84,
  },
});
