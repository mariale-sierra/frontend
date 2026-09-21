import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { ConfirmationPopup } from '../../../components/ui/confirmationPopup';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { ChallengeAccentBackdrop } from '../../../components/challenge/challengeAccentBackdrop';
import { ChallengeParticipantManageRow } from '../../../components/challenge/ChallengeParticipantManageRow';
import { ChallengeParticipantManageRowSkeleton } from '../../../components/challenge/ChallengeParticipantManageRowSkeleton';
import { JoinRequestListItem } from '../../../components/spaces/JoinRequestListItem';
import { JoinRequestRowSkeleton } from '../../../components/spaces/JoinRequestRowSkeleton';
import { useChallengeJoinRequests } from '../../../hooks/useChallengeJoinRequests';
import { useChallengeParticipants } from '../../../hooks/useChallengeParticipants';
import { useAuth } from '../../../hooks/useAuth';
import {
  approveChallengeJoinRequest,
  getChallenge,
  isChallengeOwner,
  rejectChallengeJoinRequest,
  removeChallengeParticipant,
} from '../../../services/challenge/challenge.service';
import { getChallengeAccentColor, pickDominantActivityCategory } from '../../../services/adapters/challengeState';
import { colors, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { safeBack } from '../../../utils/navigation';
import type { ChallengeContract, ChallengeParticipantContract } from '../../../types/challenge';

const SKELETON_ROWS = 4;
const EMPTY_STATE_MIN_HEIGHT = 220;
const EMPTY_ICON_SIZE = 34;

type JoinRequestAction = 'approve' | 'reject';

/**
 * Owner-only "Manage challenge" screen (Bloque 1). Same shape as
 * app/messaging/spaces/[id]/manage.tsx: a private challenge's lever is
 * admission control, a public challenge's lever is removing a participant
 * directly — never both at once, matching the ticket's own scope (private =
 * admission, public = removal).
 *
 * A private challenge's pending join requests render directly here — no
 * separate "Join requests" screen/tap needed to see or answer them anymore
 * (per explicit feedback: two screens for one job was redundant). The row
 * (`JoinRequestListItem`) and approve/reject logic are the same ones the
 * old app/challenge/[id]/join-requests.tsx used, just inlined; that route no
 * longer exists (Spaces' own join-requests screen is untouched — a
 * different feature, same shape).
 *
 * In the challenge's own colors (`ChallengeAccentBackdrop`, its name under the title),
 * like its info and members screens, and its loading state is skeleton rows, not a spinner.
 */
export default function ManageChallengeScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = typeof id === 'string' && id.length > 0 ? id : null;
  const { userId } = useAuth();

  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ChallengeParticipantContract | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  // The join request being answered, and how: it is the only row that is busy.
  const [pendingRequest, setPendingRequest] = useState<{ requestId: string; action: JoinRequestAction } | null>(null);

  useEffect(() => {
    if (!challengeId) return;
    getChallenge(challengeId).then(setChallenge).catch(() => setChallenge(null));
  }, [challengeId]);

  const isOwner = isChallengeOwner(challenge, userId);
  const isPrivate = challenge?.visibility === 'private';

  // The participants are fetched with the challenge, so a public challenge's list is
  // loading from the first frame (not an empty one first). The join requests are only
  // asked for a private challenge, by its owner: the endpoint is for those alone, and
  // asking it of a public one would only raise an error toast.
  const { participants, loading: participantsLoading } = useChallengeParticipants(challengeId);
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    reload: reloadRequests,
  } = useChallengeJoinRequests(isOwner && isPrivate ? challengeId : null);

  useEffect(() => {
    // A direct link to someone else's challenge: nothing to manage here.
    if (challenge && !isOwner) safeBack();
  }, [challenge, isOwner]);

  // The owner is not a participant to remove, and neither is who was just removed.
  const removable = useMemo(
    () => participants.filter((participant) => participant.role !== 'owner' && !removedIds.includes(participant.id)),
    [participants, removedIds],
  );

  const accentColor = challenge
    ? getChallengeAccentColor(pickDominantActivityCategory(challenge))
    : colors.primary;

  async function confirmRemove() {
    if (!challengeId || !removeTarget) return;
    setRemoving(true);
    try {
      await removeChallengeParticipant(challengeId, removeTarget.id);
      setRemovedIds((previous) => [...previous, removeTarget.id]);
      setRemoveTarget(null);
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setRemoving(false);
    }
  }

  async function respondToRequest(requestId: string, action: JoinRequestAction) {
    if (!challengeId) return;
    setPendingRequest({ requestId, action });
    try {
      const answer = action === 'approve' ? approveChallengeJoinRequest : rejectChallengeJoinRequest;
      await answer(challengeId, requestId);
      reloadRequests();
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setPendingRequest(null);
    }
  }

  const skeleton = (
    <View style={styles.list}>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <ChallengeParticipantManageRowSkeleton key={index} />
      ))}
    </View>
  );

  return (
    <ScreenBackground variant="default">
      {challenge ? <ChallengeAccentBackdrop color={accentColor} /> : null}

      <ScreenHeader
        title={t('challengeProgress.manageScreenTitle')}
        subtitle={challenge?.name}
        subtitleColor={accentColor}
      />

      {!challenge ? (
        skeleton
      ) : isPrivate ? (
        requestsLoading ? (
          <View style={styles.list}>
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <JoinRequestRowSkeleton key={index} />
            ))}
          </View>
        ) : requestsError ? (
          <View style={styles.empty}>
            <Icon name="cloud-offline-outline" size={EMPTY_ICON_SIZE} color={withAlpha(colors.paper, textOpacity.tertiary)} />
            <Text variant="body" tone="secondary" align="center">
              {t('challengeProgress.joinRequestsLoadError')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text variant="header" tone="secondary" style={styles.sectionLabel}>
                {t('challengeProgress.joinRequestsTitle')}
              </Text>
            }
            renderItem={({ item }) => (
              <JoinRequestListItem
                request={item}
                onApprove={() => respondToRequest(item.id, 'approve')}
                onReject={() => respondToRequest(item.id, 'reject')}
                approveA11yLabel={t('challengeProgress.joinRequestApproveA11y')}
                rejectA11yLabel={t('challengeProgress.joinRequestRejectA11y')}
                pendingAction={pendingRequest?.requestId === item.id ? pendingRequest.action : null}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Icon name="person-add-outline" size={EMPTY_ICON_SIZE} color={withAlpha(colors.paper, textOpacity.tertiary)} />
                <Text variant="body" tone="secondary" align="center">
                  {t('challengeProgress.joinRequestsEmpty')}
                </Text>
              </View>
            }
          />
        )
      ) : participantsLoading ? (
        skeleton
      ) : (
        <FlatList
          data={removable}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text variant="header" tone="secondary" style={styles.sectionLabel}>
              {t('challengeProgress.manageMembersRow')}
            </Text>
          }
          renderItem={({ item }) => (
            <ChallengeParticipantManageRow participant={item} onRemove={() => setRemoveTarget(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="people-outline" size={EMPTY_ICON_SIZE} color={withAlpha(colors.paper, textOpacity.tertiary)} />
              <Text variant="body" tone="secondary" align="center">
                {t('challengeProgress.membersEmpty')}
              </Text>
            </View>
          }
        />
      )}

      <ConfirmationPopup
        visible={removeTarget !== null}
        title={t('challengeProgress.removeParticipantTitle', { username: removeTarget?.username ?? '' })}
        description={t('challengeProgress.removeParticipantDescription')}
        icon="person-remove-outline"
        iconColor={colors.error}
        onDismiss={() => !removing && setRemoveTarget(null)}
        primaryButton={{
          label: t('challengeProgress.removeParticipantConfirm'),
          onPress: confirmRemove,
          variant: 'danger',
          loading: removing,
        }}
        secondaryButton={{
          label: t('challengeProgress.removeParticipantCancel'),
          onPress: () => setRemoveTarget(null),
          variant: 'neutral',
          disabled: removing,
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  sectionLabel: {
    paddingBottom: spacing.sm,
  },
  empty: {
    minHeight: EMPTY_STATE_MIN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
