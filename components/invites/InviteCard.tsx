import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../../constants/theme';
import { Card } from '../ui/card';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { UserAvatar } from '../ui/userAvatar';
import { ConfirmationPopup } from '../ui/confirmationPopup';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import type { ChallengeInviteContract, InviteStatus } from '../../types/invite';
import type { InviteAction } from '../../hooks/useInvites';

const STATUS_COLOR: Record<InviteStatus, string> = {
  pending: colors.primary,
  accepted: colors.success,
  declined: colors.error,
  cancelled: colors.textMuted,
  expired: colors.textMuted,
};

interface InviteCardProps {
  invite: ChallengeInviteContract;
  /** 'received' shows accept/decline; 'sent' shows cancel. */
  direction: 'received' | 'sent';
  /** True while ANY invite action is in flight (disables all buttons). */
  busy: boolean;
  /** True while THIS invite's action is in flight (shows the spinner). */
  processing: boolean;
  onAction: (action: InviteAction, invite: ChallengeInviteContract) => void;
}

/**
 * One invite row for the invitations screen. Cancelling asks for
 * confirmation first; accept/decline run directly but stay disabled while
 * any action is processing so an invite can never be handled twice.
 */
export function InviteCard({ invite, direction, busy, processing, onAction }: InviteCardProps) {
  const { t } = useTranslation();
  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);

  const otherUser = direction === 'received' ? invite.sender : invite.recipient;
  const isPending = invite.status === 'pending';

  const handleCancelConfirmed = () => {
    setConfirmCancelVisible(false);
    onAction('cancel', invite);
  };

  return (
    <Card variant="basicGlass" radius="xl" padding="lg">
      <Stack gap="sm">
        <Row align="center" gap="md">
          <UserAvatar username={otherUser?.username ?? '?'} size={40} />
          <View style={styles.headerText}>
            <Text variant="subheader" numberOfLines={1}>
              {invite.challenge?.name ?? t('invites.unknownChallenge')}
            </Text>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {direction === 'received'
                ? t('invites.from', { username: otherUser?.username ?? '?' })
                : t('invites.to', { username: otherUser?.username ?? '?' })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[invite.status] }]}>
            <Text variant="caption" style={{ color: STATUS_COLOR[invite.status] }}>
              {t(`invites.status.${invite.status}`)}
            </Text>
          </View>
        </Row>

        {invite.message ? (
          <Text variant="body" tone="secondary" numberOfLines={2}>
            “{invite.message}”
          </Text>
        ) : null}

        {isPending && (
          <Row justify="flex-end" gap="sm">
            {direction === 'received' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  loading={processing}
                  onPress={() => onAction('decline', invite)}
                >
                  {t('invites.actions.decline')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={busy}
                  loading={processing}
                  onPress={() => onAction('accept', invite)}
                >
                  {t('invites.actions.accept')}
                </Button>
              </>
            ) : (
              <Button
                variant="danger"
                size="sm"
                disabled={busy}
                loading={processing}
                onPress={() => setConfirmCancelVisible(true)}
              >
                {t('invites.actions.cancel')}
              </Button>
            )}
          </Row>
        )}
      </Stack>

      <ConfirmationPopup
        visible={confirmCancelVisible}
        title={t('invites.confirmCancelTitle')}
        description={t('invites.confirmCancelDescription', {
          challenge: invite.challenge?.name ?? '',
        })}
        primaryButton={{
          label: t('invites.actions.cancel'),
          variant: 'danger',
          onPress: handleCancelConfirmed,
        }}
        secondaryButton={{
          label: t('common.actions.back'),
          onPress: () => setConfirmCancelVisible(false),
        }}
        onDismiss={() => setConfirmCancelVisible(false)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerText: {
    flex: 1,
    gap: 2,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
