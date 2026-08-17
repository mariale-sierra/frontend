import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../components/layout/screenBackground';
import { BackButton } from '../components/ui/backButton';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { Divider } from '../components/ui/divider';
import { InviteCard } from '../components/invites/InviteCard';
import { useInvites, InviteAction } from '../hooks/useInvites';
import { useErrorNotificationStore } from '../store/errorNotificationStore';
import { colors, spacing } from '../constants/theme';
import type { ChallengeInviteContract } from '../types/invite';

const REQUESTS_PREVIEW_COUNT = 3;

const SUCCESS_KEY: Record<InviteAction, string> = {
  accept: 'invites.successAccepted',
  decline: 'invites.successDeclined',
  cancel: 'invites.successCancelled',
};

/**
 * Invitations screen: pending received requests up top (accept/deny, capped
 * with a "see more" reveal), sent invites below as a status/activity log.
 * Both sections are real challenge-invite data — no mock content.
 */
export default function Invitations() {
  const { t } = useTranslation();
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const { received, sent, loading, refreshing, error, processingId, refresh, reload, runAction } =
    useInvites();
  const { show, showSuccess } = useErrorNotificationStore();

  const pendingReceived = useMemo(
    () => received.filter((invite) => invite.status === 'pending'),
    [received],
  );
  const visibleRequests = requestsExpanded
    ? pendingReceived
    : pendingReceived.slice(0, REQUESTS_PREVIEW_COUNT);

  const handleAction = async (action: InviteAction, invite: ChallengeInviteContract) => {
    const ok = await runAction(action, invite.id);
    if (ok) {
      showSuccess({ message: t(SUCCESS_KEY[action], { challenge: invite.challenge?.name ?? '' }) });
    } else {
      show({ message: t('invites.errorAction') });
    }
  };

  return (
    <ScreenBackground variant="default">
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <BackButton />
          <Text variant="title">{t('invites.screenTitle')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text tone="secondary">{t('invites.loadError')}</Text>
            <Button variant="outline" size="sm" onPress={reload}>
              {t('common.actions.continue')}
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text variant="subheader" style={styles.sectionLabel}>
                {t('invites.requestsSectionTitle')}
              </Text>

              {pendingReceived.length === 0 ? (
                <Text tone="secondary" style={styles.emptyText}>
                  {t('invites.emptyPendingReceived')}
                </Text>
              ) : (
                <View style={styles.rows}>
                  {visibleRequests.map((invite, index) => (
                    <View key={invite.id}>
                      {index > 0 && <Divider marginVertical="md" />}
                      <InviteCard
                        invite={invite}
                        direction="received"
                        busy={processingId !== null}
                        processing={processingId === invite.id}
                        onAction={handleAction}
                      />
                    </View>
                  ))}
                </View>
              )}

              {pendingReceived.length > REQUESTS_PREVIEW_COUNT && (
                <Pressable
                  onPress={() => setRequestsExpanded((v) => !v)}
                  hitSlop={8}
                  style={styles.seeMore}
                >
                  <Text variant="body" tone="secondary">
                    {requestsExpanded ? t('invites.seeLess') : t('invites.seeMore')}
                  </Text>
                </Pressable>
              )}
            </View>

            <Divider variant="section" marginVertical="lg" />

            <View style={styles.section}>
              <Text variant="subheader" style={styles.sectionLabel}>
                {t('invites.sentTab')}
              </Text>

              {sent.length === 0 ? (
                <Text tone="secondary" style={styles.emptyText}>
                  {t('invites.emptySent')}
                </Text>
              ) : (
                <View style={styles.rows}>
                  {sent.map((invite, index) => (
                    <View key={invite.id}>
                      {index > 0 && <Divider marginVertical="md" />}
                      <InviteCard
                        invite={invite}
                        direction="sent"
                        busy={processingId !== null}
                        processing={processingId === invite.id}
                        onAction={handleAction}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    color: colors.textSecondary,
  },
  rows: {
    gap: 0,
  },
  emptyText: {
    paddingVertical: spacing.sm,
  },
  seeMore: {
    alignSelf: 'center',
    paddingTop: spacing.xs,
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
