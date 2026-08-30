import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { UserAvatar } from '../ui/userAvatar';
import { ConfirmationPopup } from '../ui/confirmationPopup';
import { Row } from '../layout/row';
import { formatRelativeTime } from '../../utils/time';
import type { ChallengeInviteContract, InviteStatus } from '../../types/invite';
import type { InviteAction } from '../../hooks/useInvites';

const MUTED = withAlpha(colors.paper, textOpacity.tertiary);

const STATUS_COLOR: Record<InviteStatus, string> = {
  pending: colors.primary,
  accepted: colors.success,
  declined: colors.error,
  cancelled: MUTED,
  expired: MUTED,
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
 * One invite row. Flat, no card chrome — a request-inbox style layout
 * (avatar + identity + accept/deny pills for pending received invites,
 * avatar + identity + status/cancel for sent ones) instead of a boxed card.
 */
export function InviteCard({ invite, direction, busy, processing, onAction }: InviteCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);

  const otherUser = direction === 'received' ? invite.sender : invite.recipient;
  const isPending = invite.status === 'pending';
  const challengeName = invite.challenge?.name ?? t('invites.unknownChallenge');
  const challengeId = invite.challenge?.id ?? null;

  const handleCancelConfirmed = () => {
    setConfirmCancelVisible(false);
    onAction('cancel', invite);
  };

  return (
    <Row align="center" gap="md">
      <UserAvatar username={otherUser?.username ?? '?'} size={44} />

      <View style={styles.textCol}>
        <Text variant="body" weight="bold" numberOfLines={1}>
          @{otherUser?.username ?? '?'}
        </Text>
        {/* Fixed 2026-08-30, per explicit "at no point can I see what
            challenge I'm joining, or click to see its info" report — this
            used to be a plain, non-interactive caption. Same
            "name + chevron-forward" affordance ExploreChallengeCard's own
            "View" link already uses elsewhere, not a new interaction
            language for the app. */}
        <Pressable
          onPress={() => challengeId && router.push(`/challenge/${challengeId}`)}
          disabled={!challengeId}
          hitSlop={4}
          accessibilityRole={challengeId ? 'button' : undefined}
          accessibilityLabel={challengeId ? t('invites.viewChallengeA11y', { name: challengeName }) : undefined}
          style={styles.challengeLink}
        >
          <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.challengeLinkText}>
            {invite.challenge?.duration_days
              ? t('invites.challengeWithDuration', {
                  name: challengeName,
                  duration: t('challenges.durationDaysLabel', { count: invite.challenge.duration_days }),
                })
              : challengeName}
          </Text>
          {challengeId && (
            <Icon name="chevron-forward-outline" size={12} color={withAlpha(colors.paper, textOpacity.tertiary)} />
          )}
        </Pressable>
      </View>

      {direction === 'received' ? (
        isPending && (
          <Row gap="sm" style={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              loading={processing}
              onPress={() => onAction('accept', invite)}
            >
              {t('invites.actions.accept')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              loading={processing}
              onPress={() => onAction('decline', invite)}
            >
              {t('invites.actions.decline')}
            </Button>
          </Row>
        )
      ) : isPending ? (
        <Pressable
          onPress={() => setConfirmCancelVisible(true)}
          disabled={busy}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text
            variant="caption"
            weight="medium"
            style={[styles.cancelLabel, busy && styles.cancelLabelDisabled]}
          >
            {t('invites.actions.cancel')}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.statusCol}>
          <Text variant="caption" style={{ color: STATUS_COLOR[invite.status] }}>
            {t(`invites.status.${invite.status}`)}
          </Text>
          <Text variant="caption" tone="secondary">
            {formatRelativeTime(invite.responded_at ?? invite.created_at)}
          </Text>
        </View>
      )}

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
    </Row>
  );
}

const styles = StyleSheet.create({
  textCol: {
    flex: 1,
    // `spacing.xs` (4) — was a hardcoded `2`, not a real token on the
    // scale (theme.ts's own comment: "DO NOT use a spacing value outside
    // this scale"). Same fix already applied to invite.tsx's own userInfo
    // gap this session.
    gap: spacing.xs,
  },
  actions: {
    flexShrink: 0,
  },
  challengeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  challengeLinkText: {
    flexShrink: 1,
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  cancelLabel: {
    color: colors.error,
  },
  cancelLabelDisabled: {
    opacity: 0.5,
  },
});
