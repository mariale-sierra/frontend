import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityScrollGradient from '../../../components/layout/activityScrollGradient';
import { ChallengeHeader, ChallengeRoutineList } from '../../../components/challenge/detail';
import { CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar } from '../../../components/challenge/create';
import {
  ChallengePagerDots,
  ChallengePhotoGalleryModal,
  ChallengePhotoMosaicSkeleton,
  ChallengeWorkoutCalendar,
} from '../../../components/challenge/progress';
import { ChallengeProgressCard } from '../../../components/challenge/progress/ChallengeProgressCard';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { colors, spacing } from '../../../constants/theme';
import { getChallenge, joinChallenge, leaveChallenge } from '../../../services/challenge/challenge.service';
import { getMyChallenges } from '../../../services/user/user.service';
import { toChallengeDetailViewModel } from '../../../services/adapters/index';
import { useConfirmationPopup } from '../../../hooks/useConfirmationPopup';
import { useAuth } from '../../../hooks/useAuth';
import { useChallengeActiveProgress } from '../../../hooks/useChallengeActiveProgress';
import type { ChallengeContract } from '../../../types/challenge';
import { useTranslation } from 'react-i18next';

type MembershipStatus = 'creator' | 'joined' | 'none';
type DetailTab = 'info' | 'progress';

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
  const isEnrolled = membershipStatus === 'creator' || membershipStatus === 'joined';

  // Which tab is showing — Info (challenge description/routine days) or Progress
  // (this user's day-by-day dashboard). Defaults to Progress once we learn the
  // user is enrolled, so returning members land on "how am I doing" first; the
  // ref makes that a one-time default instead of fighting a manual tab switch.
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const hasSetDefaultTab = useRef(false);
  useEffect(() => {
    if (membershipLoading || hasSetDefaultTab.current) return;
    hasSetDefaultTab.current = true;
    if (isEnrolled) setActiveTab('progress');
  }, [membershipLoading, isEnrolled]);

  const { width } = useWindowDimensions();
  const progressData = useChallengeActiveProgress(typeof id === 'string' ? id : null);
  const [progressPage, setProgressPage] = useState(0);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const galleryVisible = selectedPhotoId != null || selectedDay != null;

  function handleProgressScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = event.nativeEvent.contentOffset.x;
    setProgressPage(Math.round(offsetX / width));
  }

  function openPhotoGallery(photoId: string) {
    const photo = progressData.photos.find((item) => item.id === photoId);
    setSelectedPhotoId(photoId);
    setSelectedDay(photo?.day ?? null);
  }

  function openDayGallery(day: number) {
    const dayPhoto = progressData.photos.find((photo) => photo.day === day);
    if (!dayPhoto) return;
    setSelectedPhotoId(dayPhoto.id);
    setSelectedDay(day);
  }

  function closeGallery() {
    setSelectedPhotoId(null);
    setSelectedDay(null);
  }

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
          {isEnrolled && (
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => setActiveTab('info')}
                style={({ pressed }) => [styles.tabButton, activeTab === 'info' && styles.tabButtonActive, pressed && styles.pressed]}
              >
                <Text variant="label" style={[styles.tabLabel, activeTab === 'info' && styles.tabLabelActive]}>
                  {t('challenges.infoTab')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('progress')}
                style={({ pressed }) => [styles.tabButton, activeTab === 'progress' && styles.tabButtonActive, pressed && styles.pressed]}
              >
                <Text variant="label" style={[styles.tabLabel, activeTab === 'progress' && styles.tabLabelActive]}>
                  {t('challenges.progressTab')}
                </Text>
              </Pressable>
            </View>
          )}

          {activeTab === 'progress' && isEnrolled ? (
            <View style={styles.progressTabContent}>
              <ChallengeProgressCard
                progress={progressData.progress}
                totalDays={progressData.totalDays}
                title={progressData.title}
                timeLeft={progressData.timeLeft}
              />

              <View style={styles.progressPagerWrap}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  bounces={false}
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleProgressScrollEnd}
                  scrollEventThrottle={16}
                >
                  <ChallengePhotoMosaicSkeleton
                    width={width}
                    photos={progressData.photos}
                    totalDays={progressData.totalDays}
                    bottomInset={0}
                    onPressPhoto={openPhotoGallery}
                  />
                  <ChallengeWorkoutCalendar
                    width={width}
                    startDate={progressData.startDate}
                    totalDays={progressData.totalDays}
                    completedWorkoutDays={progressData.completedWorkoutDays}
                    selectedDay={selectedDay}
                    photoDays={progressData.photoDays}
                    bottomInset={0}
                    onPressDay={openDayGallery}
                  />
                </ScrollView>
              </View>

              <ChallengePagerDots activeIndex={progressPage} />

              <ChallengePhotoGalleryModal
                visible={galleryVisible}
                photos={progressData.photos}
                selectedPhotoId={selectedPhotoId}
                selectedDay={selectedDay}
                onClose={closeGallery}
              />
            </View>
          ) : (
            <ChallengeRoutineList
              routine={challengeView.days}
              onPressDay={(day) => router.push(`/challenge/${id}/routine/${day}`)}
            />
          )}
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
  tabRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: spacing.xl,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: spacing.xxs,
  },
  tabButton: {
    minWidth: 96,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.textPrimary,
  },
  tabLabel: {
    color: colors.textPrimary,
    opacity: 0.7,
  },
  tabLabelActive: {
    color: colors.textInverse,
    opacity: 1,
    fontWeight: '700',
  },
  progressTabContent: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  progressPagerWrap: {
    height: 480,
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
