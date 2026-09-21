import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { Divider } from '../../../components/ui/divider';
import { ConfirmationPopup } from '../../../components/ui/confirmationPopup';
import { Row } from '../../../components/layout/row';
import { ChallengeAccentGlow } from '../../../components/challenge/challengeAccentGlow';
import { ChallengeParticipantManageRow } from '../../../components/challenge/ChallengeParticipantManageRow';
import { useChallengeParticipants } from '../../../hooks/useChallengeParticipants';
import { useAuth } from '../../../hooks/useAuth';
import {
  getChallenge,
  isChallengeOwner,
  removeChallengeParticipant,
} from '../../../services/challenge/challenge.service';
import { getChallengeAccentColor, pickDominantActivityCategory } from '../../../services/adapters/challengeState';
import { colors, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import type { ChallengeContract, ChallengeParticipantContract } from '../../../types/challenge';

/**
 * Owner-only "Manage challenge" screen (Bloque 1). Same shape as
 * app/messaging/spaces/[id]/manage.tsx: a private challenge's lever is
 * admission control (links to join-requests.tsx), a public challenge's lever
 * is removing a participant directly here — never both at once, matching the
 * ticket's own scope (private = admission, public = removal).
 */
export default function ManageChallengeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = typeof id === 'string' && id.length > 0 ? id : null;
  const { userId } = useAuth();

  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const { participants, loading } = useChallengeParticipants(challengeId);
  const [removeTarget, setRemoveTarget] = useState<ChallengeParticipantContract | null>(null);
  const [removing, setRemoving] = useState(false);
  const [localParticipants, setLocalParticipants] = useState<ChallengeParticipantContract[]>([]);

  useEffect(() => {
    if (!challengeId) return;
    getChallenge(challengeId).then(setChallenge).catch(() => setChallenge(null));
  }, [challengeId]);

  useEffect(() => {
    setLocalParticipants(participants.filter((p) => p.role !== 'owner'));
  }, [participants]);

  const isOwner = isChallengeOwner(challenge, userId);
  useEffect(() => {
    if (challenge && !isOwner) {
      router.back();
    }
  }, [challenge, isOwner, router]);

  const accentColor = challenge
    ? getChallengeAccentColor(pickDominantActivityCategory(challenge))
    : colors.primary;
  const isPrivate = challenge?.visibility === 'private';

  async function confirmRemove() {
    if (!challengeId || !removeTarget) return;
    setRemoving(true);
    try {
      await removeChallengeParticipant(challengeId, removeTarget.id);
      setLocalParticipants((prev) => prev.filter((p) => p.id !== removeTarget.id));
      setRemoveTarget(null);
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setRemoving(false);
    }
  }

  return (
    <ScreenBackground variant="default">
      {challenge && <ChallengeAccentGlow color={accentColor} />}

      <View style={styles.header}>
        <BackButton style={styles.headerSideButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('challengeProgress.manageScreenTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {!challenge ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isPrivate ? (
        <View style={styles.content}>
          <Pressable
            onPress={() => router.push(`/challenge/${challengeId}/join-requests`)}
            accessibilityRole="button"
          >
            <Row align="center" gap="md" style={styles.actionRow}>
              <Text variant="body" style={styles.actionRowLabel}>
                {t('challengeProgress.manageJoinRequestsRow')}
              </Text>
              <Icon name="chevron-forward-outline" size={20} color={withAlpha(colors.paper, textOpacity.tertiary)} />
            </Row>
          </Pressable>
          <Divider marginVertical="xs" />
        </View>
      ) : (
        <>
          <Text variant="label" tone="secondary" style={styles.sectionLabel}>
            {t('challengeProgress.manageMembersRow')}
          </Text>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={localParticipants}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <ChallengeParticipantManageRow
                  participant={item}
                  onRemove={() => setRemoveTarget(item)}
                  removing={removing && removeTarget?.id === item.id}
                />
              )}
              ItemSeparatorComponent={() => <Divider marginVertical="xs" />}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text tone="secondary">{t('challengeProgress.membersEmpty')}</Text>
                </View>
              }
            />
          )}
        </>
      )}

      <ConfirmationPopup
        visible={removeTarget !== null}
        title={t('challengeProgress.removeParticipantTitle')}
        description={t('challengeProgress.removeParticipantDescription')}
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
          disabled: removing,
        }}
      />
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
  content: {
    paddingHorizontal: spacing.lg,
  },
  actionRow: {
    paddingVertical: spacing.md,
  },
  actionRowLabel: {
    flex: 1,
  },
  sectionLabel: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
