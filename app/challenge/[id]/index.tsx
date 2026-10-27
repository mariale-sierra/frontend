import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { BackButton } from '../../../components/ui/backButton';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { ChallengeHeader, ChallengeAboutSection, ChallengeRoutineList, ChallengeInfoContentSkeleton } from '../../../components/challenge/detail';
import { ChallengeAccentBackdrop } from '../../../components/challenge/challengeAccentBackdrop';
import { CoachMark } from '../../../components/onboarding/CoachMark';
import { ShareToChatSheet } from '../../../components/social/ShareToChatSheet';
import type { ChallengeInfoRow } from '../../../components/challenge/detail';
import { colors, radius, shadows, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { closeChallenge, isChallengeOwner, joinChallenge, reopenChallenge } from '../../../services/challenge/challenge.service';
import { getMyMembership } from '../../../services/challenge/myMembership';
import { acceptInvite, declineInvite, getReceivedInvites } from '../../../services/invites/invite.service';
import { invalidateChallengeProgressCache } from '../../../hooks/useChallengeProgress';
import type { ChallengeInviteContract } from '../../../types/invite';
import { toChallengeDetailViewModel } from '../../../services/adapters/index';
import { getChallengeAccentColor, pickDominantActivityCategory } from '../../../services/adapters/challengeState';
import { useConfirmationPopup } from '../../../hooks/useConfirmationPopup';
import { useAuth } from '../../../hooks/useAuth';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useErrorNotificationStore } from '../../../store/errorNotificationStore';
import { markChallengeMembershipSeen } from '../../../utils/seenChallengeMemberships';
import { hasSeenChallengeJoinCallout, markChallengeJoinCalloutSeen } from '../../../utils/challengeJoinCallout';
import { FORCE_SHOW_ONBOARDING_PREVIEWS } from '../../../constants/onboardingDebug';
import { shareChallengeExternally } from '../../../utils/shareChallenge';
import type { ChallengeContract } from '../../../types/challenge';
import { invalidateAfterMembershipChanged, invalidateChallenge } from '../../../services/cache/queries';
import { loadChallenge } from '../../../services/cache/challengeLoaders';
import { ChallengeCoverTile } from '../../../components/challenge/card/ChallengeCoverTile';
import { pickChallengeImageUrl } from '../../../services/adapters/challengeListAdapter';
import { useImagesReady } from '../../../hooks/useImagesReady';

/** The header photo: full width, about 3:5 as tall as wide (Sprint 10 wireframe). */
const HERO_ASPECT_RATIO = 5 / 3;

type MembershipStatus = 'creator' | 'joined' | 'requested' | 'none';

/**
 * Challenge info screen — title, info rows (duration/location/focus/proof),
 * "About", and the cycle's routine list. This is what the info-circle icon
 * on the Consistency screen (app/challenge/[id]/progress.tsx) navigates to,
 * and what a routine row's chevron leads BACK from — tapping a row here
 * pushes into Routine-Detail (app/challenge/[id]/routine/[day].tsx), never
 * the other way around.
 */
export default function ChallengeDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // `inviteId`: opened from a challenge-invite notification (notificationRoutes.ts).
  const { id, inviteId } = useLocalSearchParams<{ id: string; inviteId?: string }>();
  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [loading, setLoading] = useState(true);
  // Sprint 10: the header photo is downloaded before the screen shows, so the
  // skeleton stays until the data and the photo are both ready.
  const coverReady = useImagesReady([challenge ? pickChallengeImageUrl(challenge) : null], { enabled: !loading });
  const [error, setError] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('none');
  const [membershipLoading, setMembershipLoading] = useState(true);
  const { show, showSuccess } = useErrorNotificationStore();
  // A pending invite to this challenge for the current user: the bottom bar then
  // offers Accept / Decline instead of Join (2026-10-20 — tapping an invite
  // notification lands here, so the user sees what they're invited to first).
  const [pendingInvite, setPendingInvite] = useState<ChallengeInviteContract | null>(null);
  const [inviteAction, setInviteAction] = useState<'accept' | 'decline' | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  // Onboarding Stage 4's join callout — teaches the general concept of
  // joining (not tied to this specific challenge), shown once ever per
  // device (utils/challengeJoinCallout.ts), same shape as Stage 2/3's coach
  // marks/tips.
  const [showJoinCallout, setShowJoinCallout] = useState(false);
  useEffect(() => {
    if (FORCE_SHOW_ONBOARDING_PREVIEWS) {
      setShowJoinCallout(true);
      return;
    }
    hasSeenChallengeJoinCallout().then((seen) => {
      if (!seen) setShowJoinCallout(true);
    });
  }, []);
  const dismissJoinCallout = useCallback(() => {
    setShowJoinCallout(false);
    markChallengeJoinCalloutSeen();
  }, []);
  const { userId } = useAuth();
  const isAdmin = useIsAdmin();
  const isOwner = isChallengeOwner(challenge, userId);
  // Closed by an admin: no one can join or log new progress any more.
  const isClosed = challenge?.status === 'closed';

  const closeChallengePopup = useConfirmationPopup({
    type: 'closeChallenge',
    challengeName: challenge?.name ?? t('challenges.fallbackName'),
    onConfirm: async () => {
      const challengeId = typeof id === 'string' ? id : '';
      if (!challengeId) return;
      try {
        await closeChallenge(challengeId);
        invalidateChallenge(challengeId);
        setChallenge((prev) => (prev ? { ...prev, status: 'closed' } : prev));
        showSuccess({ message: t('challengeProgress.closeChallengeSuccess') });
      } catch {
        // The confirmation popup itself surfaces failure via its own error state; nothing else to do here.
      }
    },
  });

  // Admin-only too (AdminGuard server-side): the inverse of closing.
  const reopenChallengePopup = useConfirmationPopup({
    type: 'reopenChallenge',
    challengeName: challenge?.name ?? t('challenges.fallbackName'),
    onConfirm: async () => {
      const challengeId = typeof id === 'string' ? id : '';
      if (!challengeId) return;
      try {
        await reopenChallenge(challengeId);
        invalidateChallenge(challengeId);
        setChallenge((prev) => (prev ? { ...prev, status: 'open' } : prev));
        showSuccess({ message: t('challengeProgress.reopenChallengeSuccess') });
      } catch {
        // The global api.ts interceptor already surfaces the error toast.
      }
    },
  });

  // B2: a private challenge files a request — the button and the confirmation say so.
  const isPrivateChallenge = challenge?.visibility === 'private';
  const joinPopup = useConfirmationPopup({
    type: isPrivateChallenge ? 'requestJoin' : 'join',
    challengeName: challenge?.name ?? t('challenges.fallbackName'),
    onConfirm: async () => {
      const challengeId = typeof id === 'string' ? id : '';
      if (!challengeId) return;
      try {
        const response = await joinChallenge(challengeId);
        invalidateAfterMembershipChanged();
        const name = challenge?.name ?? t('challenges.fallbackName');

        // Private challenge: files a pending request instead of joining
        // directly (see ChallengesService.joinChallenge) — the real,
        // confirmed bug this fixes: joining a private challenge used to
        // report success and drop the requester straight in, with nothing
        // left for the owner to approve.
        if (response?.status === 'requested') {
          setMembershipStatus('requested');
          showSuccess({ message: t('challenges.joinConfirm.requestSent', { name }) });
          return;
        }

        setMembershipStatus('joined');
        // This device already has explicit, immediate feedback for this
        // membership (the toast right below) — mark it seen up front so the
        // Challenges tab's own "You're in!" popup (for an approval found
        // out about asynchronously, with no other feedback at all) never
        // also fires for this same challenge.
        void markChallengeMembershipSeen(challengeId);
        // Per explicit report: joining silently worked with no feedback and
        // no way to see the new challenge without manually finding it —
        // confirm it worked, then land on the exact list it now appears in
        // (Mine, not wherever the user happened to be browsing from, e.g.
        // Explore). `view=mine` forces the Challenges tab's own local
        // `view` state to sync even if that screen is still mounted
        // underneath this one (its `useState` initializer alone wouldn't
        // re-run on an already-mounted screen) — see its own matching
        // `useEffect` for the other half of this.
        showSuccess({ message: t('challenges.joinConfirm.success', { name }) });
        router.replace('/(tabs)/challenges?view=mine');
      } catch {
        // The confirmation popup itself surfaces failure via its own error state; nothing else to do here.
      }
    },
  });

  useEffect(() => {
    if (!id) return;
    loadChallenge(id)
      .then(setChallenge)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!challenge) return;

    // See app/challenge/[id]/routine/[day].tsx and progress.tsx — same
    // "created_by_user_id vs enrolled-list membership" check used everywhere
    // else in the app to decide whether the current user is already in.
    // B8: a private challenge's pending request comes back from the backend
    // too, so reopening this screen shows "Request sent" instead of Join.
    getMyMembership(challenge)
      .then(setMembershipStatus)
      .catch(() => setMembershipStatus('none'))
      .finally(() => setMembershipLoading(false));
  }, [challenge]);

  useEffect(() => {
    if (!challenge) return;
    let active = true;
    getReceivedInvites()
      .then((invites) => {
        if (!active) return;
        const forThisChallenge = invites.filter(
          (invite) => invite.status === 'pending' && String(invite.challenge?.id) === String(challenge.id),
        );
        // The one the notification pointed at, else any pending one for this challenge.
        setPendingInvite(forThisChallenge.find((invite) => invite.id === inviteId) ?? forThisChallenge[0] ?? null);
      })
      .catch(() => {
        // No invites to show — the regular Join button stays.
      });
    return () => {
      active = false;
    };
  }, [challenge, inviteId]);

  async function handleInvite(action: 'accept' | 'decline') {
    if (!pendingInvite || inviteAction) return;
    const name = challenge?.name ?? t('challenges.fallbackName');
    setInviteAction(action);
    try {
      if (action === 'accept') {
        await acceptInvite(pendingInvite.id);
        // Membership changed — the challenge tabs refetch (both caches, like
        // useInvites' accept); and this is its own explicit confirmation, so the
        // Challenges tab's "You're in!" never fires too.
        invalidateChallengeProgressCache();
        invalidateAfterMembershipChanged();
        void markChallengeMembershipSeen(String(challenge?.id ?? id));
        showSuccess({ message: t('invites.successAccepted', { challenge: name }) });
        router.replace('/(tabs)/challenges?view=mine');
        return;
      }
      await declineInvite(pendingInvite.id);
      setPendingInvite(null);
      showSuccess({ message: t('invites.successDeclined', { challenge: name }) });
    } catch {
      show({ message: t('invites.errorAction') });
    } finally {
      setInviteAction(null);
    }
  }

  // Sprint 9, B5: the share button opens "Send to…" — a chat inside Havit,
  // or "Other apps" for the native share sheet (WhatsApp, Instagram…).
  function handleShare() {
    if (!challenge) return;
    setShareVisible(true);
  }

  if (loading || !coverReady) {
    return (
      <ScreenBackground variant="default">
        <Row justify="space-between" align="center" style={styles.topBar}>
          <BackButton style={styles.backButton} />
          <View style={styles.iconButton} />
        </Row>
        <ChallengeInfoContentSkeleton />
      </ScreenBackground>
    );
  }

  const detailLabels = {
    locationFallbackLabel: t('challenges.locationFallback'),
    categoryFallbackLabel: t('challenges.categoryFallback'),
  };
  const result = challenge ? toChallengeDetailViewModel(challenge, detailLabels) : null;

  if (error || !result?.ok) {
    return (
      <ScreenBackground variant="default">
        <View style={styles.center}>
          <Text tone="secondary" align="center" style={styles.errorText}>
            {t('challenges.detailLoadError')}
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  const view = result.value;
  // Whether the bottom bar (Join button or "Request sent" pill) renders at
  // all — used both to gate it and to size the scroll content's own bottom
  // padding so nothing sits underneath it.
  const showsBottomBar =
    !isClosed && !membershipLoading && (membershipStatus === 'none' || membershipStatus === 'requested');
  // Activity Color System v2 — this challenge's own resolved accent color,
  // used for the glow, the "Lasts" row's calendar icon, the "Read more"
  // toggle, and each workout day's numbered badge below (not the title).
  const dominantActivityCategory = challenge ? pickDominantActivityCategory(challenge) : null;
  const accentColor = getChallengeAccentColor(dominantActivityCategory);
  // Sprint 10: an approved photo is the screen's header, with the top bar on it.
  // Without one (none, in review, rejected) the screen looks as it always did,
  // with no header space; a photo still in review or rejected is explained to
  // its creator.
  const heroPhotoUrl = challenge ? pickChallengeImageUrl(challenge) : null;
  const hasHero = !!heroPhotoUrl;
  // The top bar's dark shadow, only needed on the photo.
  const overPhoto = hasHero ? styles.overPhoto : undefined;
  const imageStatus = challenge?.imageStatus;
  const coverNotice =
    isOwner && imageStatus === 'pending'
      ? t('challengeInfo.coverPending')
      : isOwner && imageStatus === 'rejected'
        ? t('challengeInfo.coverRejected')
        : null;

  const infoRows: ChallengeInfoRow[] = [
    {
      icon: 'calendar-outline',
      iconColor: accentColor,
      label: t('challengeInfo.lastsLabel'),
      value: `${t('challenges.durationDaysLabel', { count: view.durationDays })} · ${
        view.restDaysPerCycleCount > 0
          ? t('challengeInfo.restEveryCycle', { count: view.restDaysPerCycleCount, cycleLength: view.cycleLengthDays })
          : t('challenges.noRestDays')
      }`,
    },
    { icon: 'location-outline', label: t('challengeInfo.doItAtLabel'), value: view.locationsLabel },
    { icon: 'flash-outline', label: t('challengeInfo.focusLabel'), value: view.categoriesLabel },
    { icon: 'camera-outline', label: t('challengeInfo.dailyProofLabel'), value: t('challengeInfo.dailyProofValue') },
    // B2: what finishing it gives you (the challenge badges of BADGE_CATALOG) and when it counts as finished.
    { icon: 'ribbon-outline', label: t('challengeInfo.rewardLabel'), value: t('challengeInfo.rewardValue') },
    // A closed challenge says so, in the same rows as the rest of what there is to know
    // about it, so it is not a silent state.
    ...(isClosed
      ? [
          {
            icon: 'lock-closed-outline' as const,
            iconColor: colors.error,
            label: t('challengeInfo.statusLabel'),
            value: t('challengeInfo.closedValue'),
          },
        ]
      : []),
  ];

  return (
    // With a header photo there is no top inset: the photo runs under the status
    // bar and the icons on it take the inset themselves.
    <ScreenBackground
      variant="default"
      applyTopInset={false}
      contentStyle={hasHero ? undefined : { paddingTop: Math.max(insets.top, 0) }}
    >
      {hasHero ? (
        // The backdrop's own `ink`, fixed; its glow scrolls with the content below.
        <View style={styles.inkBase} pointerEvents="none" />
      ) : (
        <ChallengeAccentBackdrop color={accentColor} />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: showsBottomBar ? spacing['2xl'] : insets.bottom + spacing.xl }}
      >
        {hasHero ? (
          // Sprint 10: the glow hangs from the bottom of the header photo (not
          // behind it) and moves with it when scrolling.
          <View
            pointerEvents="none"
            style={[styles.glowUnderHero, { top: windowWidth / HERO_ASPECT_RATIO, height: windowHeight }]}
          >
            <ChallengeAccentBackdrop color={accentColor} />
          </View>
        ) : null}
        <View style={hasHero ? styles.hero : undefined}>
          {hasHero ? (
            <ChallengeCoverTile imageUrl={heroPhotoUrl} style={styles.heroImage} testID="challenge-info-cover" />
          ) : null}
          <Row
            justify="space-between"
            align="center"
            style={[
              styles.topBar,
              hasHero && styles.topBarOverHero,
              hasHero && { paddingTop: insets.top + spacing.md },
            ]}
          >
            <BackButton style={styles.backButton} iconStyle={overPhoto} />
            <Row gap="xs" align="center">
              <Pressable
                // `dominantActivityCategory` passed through as a route param
                // (2026-08-30) — Members already resolved it here, so the
                // destination screen can paint its own accent glow on its
                // very first render instead of waiting out its own
                // `getChallenge()` round trip first (was a real ~1s "no
                // gradient, then it pops in" gap the user flagged on-device).
                // See `services/adapters/challengeState.ts`'s `parseActivityType`
                // for how the destination screen re-validates this untrusted
                // string before trusting it.
                onPress={() =>
                  router.push(
                    `/challenge/${id}/members?dominantActivityCategory=${dominantActivityCategory ?? ''}`,
                  )
                }
                style={({ pressed }) => [styles.membersPill, pressed && styles.pressed]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('challengeInfo.membersA11y')}
              >
                <Icon name="people-outline" size={18} color={colors.paper} style={overPhoto} />
                <Text variant="label" weight="bold" style={overPhoto}>
                  {view.membersJoined}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('challengeInfo.shareA11y')}
              >
                <Icon name="share-outline" size={22} color={colors.paper} style={overPhoto} />
              </Pressable>
              {isOwner && (
                <Pressable
                  onPress={() => router.push(`/challenge/${id}/manage`)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('challengeProgress.manageA11y')}
                >
                  <Icon name="settings-outline" size={22} color={colors.paper} style={overPhoto} />
                </Pressable>
              )}
              {isAdmin && challenge?.status !== 'closed' && (
                <Pressable
                  onPress={closeChallengePopup.show}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('challengeProgress.closeChallengeA11y')}
                >
                  <Icon name="lock-closed-outline" size={22} color={colors.error} style={overPhoto} />
                </Pressable>
              )}
              {isAdmin && isClosed && (
                <Pressable
                  onPress={reopenChallengePopup.show}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('challengeProgress.reopenChallengeA11y')}
                >
                  <Icon name="lock-open-outline" size={22} color={colors.paper} style={overPhoto} />
                </Pressable>
              )}
            </Row>
          </Row>
        </View>

        {coverNotice ? (
          <Text variant="caption" tone="secondary" style={styles.coverNotice} testID="challenge-info-cover-notice">
            {coverNotice}
          </Text>
        ) : null}

        <View style={styles.section}>
          <ChallengeHeader title={view.title} rows={infoRows} />
        </View>

        <View style={styles.section}>
          <ChallengeAboutSection description={view.description} accentColor={accentColor} />
        </View>

        <View style={styles.section}>
          <ChallengeRoutineList
            days={view.days}
            cycleLengthDays={view.cycleLengthDays}
            durationDays={view.durationDays}
            accentColor={accentColor}
            onPressDay={(day) => router.push(`/challenge/${id}/routine/${day}`)}
          />
        </View>
      </ScrollView>

      {/* Per explicit request: an already-joined (or creator) user sees no
          button at all here, not a disabled/relabeled one — the wireframe
          only shows this bar for someone who hasn't joined yet. Nor does anyone
          when the challenge is closed: there is nothing to join. A private
          challenge's own pending request gets the same "Request sent" pill
          Spaces already uses (Chats-49B) instead of the primary button. */}
      {showsBottomBar && membershipStatus === 'requested' && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Button variant="subtle" size="md" disabled leftIcon={<Icon name="time-outline" size={20} color={colors.paper} />}>
            {t('challenges.requestPendingLabel')}
          </Button>
        </View>
      )}

      {showsBottomBar && membershipStatus === 'none' && pendingInvite && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} testID="challenge-invite-bar">
          <Text variant="caption" tone="secondary" align="center" style={styles.inviteCaption}>
            {pendingInvite.sender?.username
              ? t('invites.invitedYou', { username: pendingInvite.sender.username })
              : t('invites.invitedYouAnonymous')}
          </Text>
          <Row gap="sm">
            <Button
              variant="subtle"
              size="md"
              textWeight="bold"
              style={styles.inviteButton}
              onPress={() => handleInvite('decline')}
              loading={inviteAction === 'decline'}
              disabled={inviteAction !== null}
              testID="challenge-invite-decline"
            >
              {t('invites.actions.decline')}
            </Button>
            <Button
              variant="primary"
              size="md"
              textWeight="bold"
              style={styles.inviteButton}
              onPress={() => handleInvite('accept')}
              loading={inviteAction === 'accept'}
              disabled={inviteAction !== null}
              testID="challenge-invite-accept"
            >
              {t('invites.actions.accept')}
            </Button>
          </Row>
        </View>
      )}

      {showsBottomBar && membershipStatus === 'none' && !pendingInvite && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {showJoinCallout && (
            <CoachMark
              message={t('challengeInfo.joinCallout')}
              onDismiss={dismissJoinCallout}
              arrowPlacement="none"
              style={styles.joinCallout}
            />
          )}
          <Pressable
            onPress={joinPopup.show}
            style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={isPrivateChallenge ? t('challengeInfo.requestJoinButton') : t('challenges.joinButtonA11y')}
          >
            <Text variant="body" weight="bold" style={styles.joinButtonText}>
              {isPrivateChallenge ? t('challengeInfo.requestJoinButton') : t('challengeInfo.joinChallengeButton')}
            </Text>
          </Pressable>
        </View>
      )}

      <ShareToChatSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        content={{ challengeId: String(challenge?.id ?? id) }}
        onShareExternally={() => {
          setShareVisible(false);
          shareChallengeExternally(
            {
              id: String(challenge?.id ?? id),
              name: view.title,
              description: view.description,
              durationDays: view.durationDays,
              membersJoined: view.membersJoined,
            },
            t,
          );
        }}
      />

      <joinPopup.Component />
      <closeChallengePopup.Component />
      <reopenChallengePopup.Component />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    opacity: 1,
  },
  topBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  // Fixed 2026-08-29, per explicit "remove the dark pill-shaped element
  // behind it" request — was a `surface`-bg, `radius.big` pill (padding
  // included). Now just the icon+count, no background chrome, matching the
  // plain-icon look of its sibling `iconButton` (the share button) right
  // next to it. `hitSlop` on the Pressable itself (see JSX) keeps a
  // reasonable touch target now that padding isn't providing one.
  membersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  section: {
    paddingBottom: spacing.lg,
  },
  // Sprint 10 wireframe: the challenge photo as a full-width header, the top
  // bar's icons drawn on top of it.
  hero: {
    marginBottom: spacing.lg,
  },
  inkBase: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.ink,
  },
  // `top` (the photo's height) and `height` (one screen) are set inline.
  glowUnderHero: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  heroImage: {
    width: '100%',
    aspectRatio: HERO_ASPECT_RATIO,
    borderRadius: 0,
  },
  topBarOverHero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  // Same dark text shadow as the "N liked this" label and the icons on feed
  // photos, so the icons read on a light photo too.
  overPhoto: {
    textShadowColor: colors.ink,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: shadows.md.shadowRadius,
  },
  coverNotice: {
    paddingHorizontal: spacing.base,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  bottomBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  // CoachMark is already full-width for `arrowPlacement="none"` — this just
  // adds the gap before the Join button below it.
  joinCallout: {
    marginBottom: spacing.sm,
  },
  inviteCaption: {
    marginBottom: spacing.sm,
  },
  inviteButton: {
    flex: 1,
  },
  joinButton: {
    height: 52,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: colors.ink,
    opacity: 1,
  },
});
