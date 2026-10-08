import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { UserAvatar } from '../ui/userAvatar';
import { ConfirmationPopup } from '../ui/confirmationPopup';
import { Row } from '../layout/row';
import { spacing } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/time';
import type { ChallengeInviteContract } from '../../types/invite';
import type { InviteAction } from '../../hooks/useInvites';

const AVATAR_SIZE = 44;

interface InviteNotificationRowProps {
  invite: ChallengeInviteContract;
  /** 'received': accept / decline. 'sent': cancel (with a confirmation). */
  direction: 'received' | 'sent';
  /** Any invite action in flight — every button waits. */
  busy: boolean;
  /** THIS invite's action in flight — its own button spins. */
  processing: boolean;
  onAction: (action: InviteAction, invite: ChallengeInviteContract) => void;
}

/**
 * A pending challenge invite inside the Notifications screen (Sprint 9, B5 —
 * the Invitations screen merged into it). Laid out exactly like a
 * notification row (NotificationListItem: avatar, text, time, no card), with
 * small actions on its right. The challenge name opens the challenge.
 */
function InviteNotificationRowBase({ invite, direction, busy, processing, onAction }: InviteNotificationRowProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const other = direction === 'received' ? invite.sender : invite.recipient;
  const username = other?.username ?? '?';
  const challengeName = invite.challenge?.name ?? t('invites.unknownChallenge');
  const challengeId = invite.challenge?.id ?? null;

  return (
    <Row align="center" gap="md" style={styles.row} testID={`invite-row-${invite.id}`}>
      <UserAvatar username={username} size={AVATAR_SIZE} />

      <View style={styles.body}>
        <Text variant="body" size="sm" weight="medium" numberOfLines={3}>
          {direction === 'received'
            ? t('notifications.invites.receivedText', { username })
            : t('notifications.invites.sentText', { username })}
          <Text
            variant="body"
            size="sm"
            weight="bold"
            onPress={challengeId ? () => router.push(`/challenge/${challengeId}`) : undefined}
            accessibilityRole={challengeId ? 'link' : undefined}
          >
            {challengeName}
          </Text>
        </Text>
        <Text variant="caption" tone="secondary">
          {formatRelativeTime(invite.created_at)}
        </Text>
      </View>

      {direction === 'received' ? (
        <View style={styles.actions}>
          <Button
            size="sm"
            variant="primary"
            loading={processing}
            disabled={busy}
            onPress={() => onAction('accept', invite)}
            testID={`invite-accept-${invite.id}`}
          >
            {t('invites.actions.accept')}
          </Button>
          <Button
            size="sm"
            variant="subtle"
            disabled={busy}
            onPress={() => onAction('decline', invite)}
            testID={`invite-decline-${invite.id}`}
          >
            {t('invites.actions.decline')}
          </Button>
        </View>
      ) : (
        <Button
          size="sm"
          variant="subtle"
          loading={processing}
          disabled={busy}
          onPress={() => setConfirmCancel(true)}
          testID={`invite-cancel-${invite.id}`}
        >
          {t('invites.actions.cancel')}
        </Button>
      )}

      <ConfirmationPopup
        visible={confirmCancel}
        title={t('invites.confirmCancelTitle')}
        description={t('invites.confirmCancelDescription', { challenge: challengeName })}
        icon="close-circle-outline"
        primaryButton={{
          label: t('invites.actions.cancel'),
          variant: 'danger',
          onPress: () => {
            setConfirmCancel(false);
            onAction('cancel', invite);
          },
        }}
        secondaryButton={{ label: t('common.actions.back'), onPress: () => setConfirmCancel(false) }}
        onDismiss={() => setConfirmCancel(false)}
      />
    </Row>
  );
}

export const InviteNotificationRow = memo(InviteNotificationRowBase);

const styles = StyleSheet.create({
  // Same as NotificationListItem's row: no card, no side padding of its own.
  row: {
    paddingVertical: spacing.md,
  },
  body: {
    flex: 1,
    // Tight title + caption stack (design system's confirmed `2` exception).
    gap: 2,
  },
  actions: {
    gap: spacing.xs,
  },
});
