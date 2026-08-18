import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityScrollGradient from '../../../components/layout/activityScrollGradient';
import { ChallengeHeader, ChallengeParticipantsList, ChallengeRoutineList } from '../../../components/challenge/detail';
import { CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar } from '../../../components/challenge/create';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { colors, spacing } from '../../../constants/theme';
import { getChallenge, joinChallenge, leaveChallenge } from '../../../services/challenge/challenge.service';
import { getMyChallenges } from '../../../services/user/user.service';
import { toChallengeDetailViewModel } from '../../../services/adapters/index';
import { useConfirmationPopup } from '../../../hooks/useConfirmationPopup';
import { useChallengeParticipants } from '../../../hooks/useChallengeParticipants';
import { useAuth } from '../../../hooks/useAuth';
import type { ChallengeContract } from '../../../types/challenge';
import { useTranslation } from 'react-i18next';

type MembershipStatus = 'creator' | 'joined' | 'none';

/**
 * Challenge info screen — description, locations/activity badges, routine
 * days. This is what you land on exploring a challenge (joined or not), and
 * what the "INFO" button on the active-progress screen (app/challenge/[id]/progress.tsx)
 * navigates back to. It never shows the day-by-day progress dashboard —
 * that's a separate route so the two don't get mixed into one screen again.
 */
export default function ChallengeDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Tracks whether the current user created this challenge or already joined it —
  // without this, "Join Challenge" was always shown/enabled and pressing it for a
  // challenge you created or already joined always failed against the backend's
  // valid guardrails ("You cannot join a challenge you created" /
  // "Already joined this challenge"), surfacing as a generic error alert.
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('none');
  const [membershipLoading, setMembershipLoading] = useState(true);
  const { participants, loading: participantsLoading } = useChallengeParticipants(
    typeof id === 'string' ? id : null,
  );

  // Join confirmation popup
  const joinPopup = useConfirmationPopup({
    type: 'join',
    challengeName: challenge?.name ?? t('challenges.fallbackName'),
    onConfirm: async () => {
      const challengeId = typeof id === 'string' ? id : '';
      if (!challengeId) {
        Alert.alert(
          t('common.errors.genericTitle'),
          t('challenges.joinInvalidId'),
        );
        return;
      }
      try {
        await joinChallenge(challengeId);
        setMembershipStatus('joined');
        Alert.alert(
          t('challenges.joinSuccessTitle'),
          t('challenges.joinSuccessMessage'),
        );
      } catch (err) {
        const backendMessage = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        Alert.alert(
          t('common.errors.genericTitle'),
          backendMessage ?? t('challenges.joinError'),
        );
      }
    },
  });

  // Leave confirmation popup
  const leavePopup = useConfirmationPopup({
    type: 'leave',
    challengeName: challenge?.name ?? t('challenges.fallbackName'),
    onConfirm: async () => {
      const challengeId = typeof id === 'string' ? id : '';
      if (!challengeId) {
        Alert.alert(
          t('common.errors.genericTitle'),
          t('challenges.leaveInvalidId'),
        );
        return;
      }
      try {
        await leaveChallenge(challengeId);
        setMembershipStatus('none');
        Alert.alert(
          t('challenges.leaveSuccessTitle'),
          t('challenges.leaveSuccessMessage'),
        );
        router.back();
      } catch {
        Alert.alert(
          t('common.errors.genericTitle'),
          t('challenges.leaveError'),
        );
      }
    },
  });

  useEffect(() => {
    if (!id) return;
    getChallenge(id)
      .then(setChallenge)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!challenge) return;

    if (userId && challenge.created_by_user_id === userId) {
      setMembershipStatus('creator');
      setMembershipLoading(false);
      return;
    }

    getMyChallenges()
      .then((enrolled) => {
        const isMember = enrolled.some(
          (c) => String(c.id) === String(challenge.id) && c.status !== 'left',
        );
        setMembershipStatus(isMember ? 'joined' : 'none');
      })
      .catch(() => setMembershipStatus('none'))
      .finally(() => setMembershipLoading(false));
  }, [challenge, userId]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.center}>
          <ActivityIndicator color="#ffffff" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.missingScreen}>
        <View style={styles.missingBlock}>
          <Text variant="title" style={styles.missingTitle}>
            {t('common.errors.genericTitle')}
          </Text>
          <Text style={styles.missingSubtitle}>
            {t('challenges.detailLoadError')}
          </Text>
        </View>
      </View>
    );
  }

  const challengeViewResult = challenge ? toChallengeDetailViewModel(challenge) : null;
  const challengeView = challengeViewResult?.ok ? challengeViewResult.value : null;

  if (!challengeView) {
    return (
      <View style={styles.missingScreen}>
        <View style={styles.missingBlock}>
          <Text variant="title" style={styles.missingTitle}>{t('challenges.incompleteTitle')}</Text>
          <Text style={styles.missingSubtitle}>
            {t('challenges.incompleteMessage')}
          </Text>
          {(challengeViewResult?.missingData ?? []).map((item) => (
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
                accessibilityLabel={t('metrics.accessibilityBack')}
                hitSlop={12}
              >
                <Icon name="chevron-back" size={22} color={colors.textPrimary} />
              </Pressable>

              <Text variant="caption" style={styles.authorTopLabel}>
                {t('challenges.byAuthor', { name: challengeView.authorName ?? t('challenges.memberAuthor') })}
              </Text>
            </View>

            <View style={styles.topRightRow}>
              {membershipStatus !== 'none' && (
                <Pressable
                  onPress={() => router.push(`/challenge/${id}/invite`)}
                  style={({ pressed }) => [styles.saveIconButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('invites.inviteUsersA11y')}
                  hitSlop={12}
                >
                  <Icon name="person-add-outline" size={20} color={colors.textPrimary} />
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [styles.saveIconButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('challenges.saveButtonA11y')}
                hitSlop={12}
              >
                <Icon name="bookmark-outline" size={20} color={colors.textPrimary} />
              </Pressable>

              {membershipStatus !== 'none' && (
                <Pressable
                  onPress={leavePopup.show}
                  style={({ pressed }) => [styles.saveIconButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('challenges.leaveButtonA11y')}
                  hitSlop={12}
                >
                  <Icon name="exit-outline" size={20} color={colors.error} />
                </Pressable>
              )}
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
          <ChallengeParticipantsList participants={participants} loading={participantsLoading} />
          <ChallengeRoutineList
            routine={challengeView.days}
            onPressDay={(day) => router.push(`/challenge/${id}/routine/${day}`)}
          />
        </ActivityScrollGradient>
      </ScrollView>

      <CreateFlowFixedBottomBar bottomInset={Math.max(insets.bottom, spacing.lg)} topPadding={spacing.md}>
        {membershipStatus === 'creator' ? (
          <CreateChallengePrimaryActionButton
            label={t('challenges.ownChallengeButton', { defaultValue: 'Your Challenge' })}
            accessibilityLabel={t('challenges.ownChallengeButtonA11y', { defaultValue: 'This is your challenge' })}
            onPress={() => {}}
            loading={false}
            disabled
          />
        ) : membershipStatus === 'joined' ? (
          <CreateChallengePrimaryActionButton
            label={t('challenges.alreadyJoinedButton', { defaultValue: 'Already Joined' })}
            accessibilityLabel={t('challenges.alreadyJoinedButtonA11y', { defaultValue: 'You already joined this challenge' })}
            onPress={() => {}}
            loading={false}
            disabled
          />
        ) : (
          <CreateChallengePrimaryActionButton
            label={t('challenges.joinButton', { defaultValue: 'Join Challenge' })}
            accessibilityLabel={t('challenges.joinButtonA11y', { defaultValue: 'Join challenge' })}
            onPress={joinPopup.show}
            loading={membershipLoading}
            disabled={membershipLoading || !id || error}
          />
        )}
      </CreateFlowFixedBottomBar>

      {/* Confirmation Popups for Join/Leave */}
      <joinPopup.Component />
      <leavePopup.Component />
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
    flexGrow: 1,
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
