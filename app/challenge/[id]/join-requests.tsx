import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { ChallengeJoinRequestListItem } from '../../../components/challenge/ChallengeJoinRequestListItem';
import { JoinRequestRowSkeleton } from '../../../components/spaces/JoinRequestRowSkeleton';
import { ChallengeAccentGlow } from '../../../components/challenge/challengeAccentGlow';
import { useChallengeJoinRequests } from '../../../hooks/useChallengeJoinRequests';
import { useAuth } from '../../../hooks/useAuth';
import {
  approveChallengeJoinRequest,
  getChallenge,
  isChallengeOwner,
  rejectChallengeJoinRequest,
} from '../../../services/challenge/challenge.service';
import { getChallengeAccentColor, pickDominantActivityCategory } from '../../../services/adapters/challengeState';
import { colors, spacing } from '../../../constants/theme';
import type { ChallengeContract } from '../../../types/challenge';

/**
 * Owner-only — pending join requests for a private challenge. Same shape as
 * app/messaging/spaces/[id]/join-requests.tsx (Chats-47E), reusing its
 * skeleton row. Only ever linked to from Manage-challenge, which already
 * gates on isChallengeOwner before showing the entry point — this screen
 * gates again itself since a direct deep link would otherwise reach it.
 */
export default function ChallengeJoinRequestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = typeof id === 'string' && id.length > 0 ? id : null;
  const { userId } = useAuth();

  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const { requests, loading, error, reload } = useChallengeJoinRequests(challengeId);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (!challengeId) return;
    getChallenge(challengeId).then(setChallenge).catch(() => setChallenge(null));
  }, [challengeId]);

  const isOwner = isChallengeOwner(challenge, userId);
  useEffect(() => {
    if (challenge && !isOwner) {
      router.back();
    }
  }, [challenge, isOwner, router]);

  const accentColor = challenge
    ? getChallengeAccentColor(pickDominantActivityCategory(challenge))
    : colors.primary;

  async function handleApprove(requestId: string) {
    if (!challengeId) return;
    setPendingRowId(requestId);
    setPendingAction('approve');
    try {
      await approveChallengeJoinRequest(challengeId, requestId);
      reload();
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setPendingRowId(null);
      setPendingAction(null);
    }
  }

  async function handleReject(requestId: string) {
    if (!challengeId) return;
    setPendingRowId(requestId);
    setPendingAction('reject');
    try {
      await rejectChallengeJoinRequest(challengeId, requestId);
      reload();
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setPendingRowId(null);
      setPendingAction(null);
    }
  }

  return (
    <ScreenBackground variant="default">
      {challenge && <ChallengeAccentGlow color={accentColor} />}

      <View style={styles.header}>
        <BackButton style={styles.headerSideButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('challengeProgress.joinRequestsTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }, (_, index) => (
            <JoinRequestRowSkeleton key={index} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('challengeProgress.joinRequestsLoadError')}</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ChallengeJoinRequestListItem
              request={item}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
              pendingAction={pendingRowId === item.id ? pendingAction : null}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="secondary">{t('challengeProgress.joinRequestsEmpty')}</Text>
            </View>
          }
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerSideButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
