import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { Icon } from '../../components/ui/icon';
import { UserAvatar } from '../../components/ui/userAvatar';
import { Row } from '../../components/layout/row';
import { ConfirmationPopup } from '../../components/ui/confirmationPopup';
import { hideConversation } from '../../services/chats/chats.service';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

// Per-component literal, same exception `ProfileHeader`'s own `AVATAR_SIZE`
// documents — this screen's identity avatar sits between the thread
// header's 32px and the full profile screen's 104px.
const AVATAR_SIZE = 88;

/**
 * Matches the Chats-47D wireframe's "Chat details" screen — reached from
 * the 1:1 thread's new ⋯ header button (see `[conversationId].tsx`).
 *
 * Both real, backend-backed actions from that wireframe are built here:
 * "View profile", a plain navigation to the existing `/profile/[userId]`
 * screen (real data, already used elsewhere — `FollowListItem`), and
 * "Delete chat" (Sprint 9, B4) — `DELETE /chats/conversations/:id` hides the
 * chat from YOUR list only; the other participant keeps it, and it comes
 * back if a new message is sent in it. The thread header's own "Active now"
 * presence pill is still left out (no online/presence data anywhere in the
 * backend) rather than faked.
 */
export default function ChatDetails() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId?: string | string[];
    otherUserId?: string | string[];
    otherUsername?: string | string[];
    otherDisplayName?: string | string[];
    otherProfileImageUrl?: string | string[];
  }>();
  // expo-router's params can come back as string[] (same unwrap
  // `app/profile/[userId].tsx` already does) — without it a bad shape here
  // means `/profile/${otherUserId}` gets pushed with something like
  // "abc,def" instead of a real UUID, which the backend's `ParseUUIDPipe`
  // rejects with a "Validation failed" toast. Real, reported bug.
  const unwrap = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const otherUserId = unwrap(params.otherUserId);
  const otherUsername = unwrap(params.otherUsername);
  const otherDisplayName = unwrap(params.otherDisplayName);
  const otherProfileImageUrl = unwrap(params.otherProfileImageUrl);
  const conversationId = unwrap(params.conversationId);

  const name = otherDisplayName || (otherUsername ? `@${otherUsername}` : '');

  const showSuccess = useErrorNotificationStore((state) => state.showSuccess);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteChat() {
    if (!conversationId) return;
    setDeleting(true);
    try {
      await hideConversation(conversationId);
      setDeleteConfirmVisible(false);
      showSuccess({ message: t('chats.deleteChatSuccess') });
      // Back to the conversation list (which refetches on focus, so the
      // chat is gone from it) — past the thread itself, which would just
      // reopen the chat.
      router.dismissTo('/messaging');
    } catch {
      // Global api.ts interceptor already shows the error toast.
      setDeleting(false);
    }
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Text variant="label" weight="bold" align="center" style={styles.headerTitle}>
          {t('chats.detailsTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.identity}>
        <UserAvatar username={otherUsername ?? ''} imageUrl={otherProfileImageUrl || null} size={AVATAR_SIZE} />
        <Text variant="title" align="center">
          {name}
        </Text>
      </View>

      {otherUserId && (
        <View style={styles.section}>
          <Row
            align="center"
            gap="md"
            style={styles.row}
            pressable
            onPress={() => router.push(`/profile/${otherUserId}`)}
          >
            <Icon name="person-outline" size={20} color={colors.paper} />
            <Text variant="label" weight="medium" style={styles.rowLabel}>
              {t('chats.viewProfile')}
            </Text>
            <Icon name="chevron-forward" size={18} color={withAlpha(colors.paper, textOpacity.tertiary)} />
          </Row>
        </View>
      )}

      {conversationId && (
        <View style={[styles.section, styles.sectionSpaced]}>
          <Row
            align="center"
            gap="md"
            style={styles.row}
            pressable
            onPress={() => setDeleteConfirmVisible(true)}
            accessibilityRole="button"
            testID="delete-chat"
          >
            <Icon name="trash-outline" size={20} color={colors.error} />
            <Text variant="label" weight="medium" style={[styles.rowLabel, styles.destructiveLabel]}>
              {t('chats.deleteChat')}
            </Text>
          </Row>
        </View>
      )}

      <ConfirmationPopup
        visible={deleteConfirmVisible}
        title={t('chats.deleteChatConfirmTitle')}
        description={t('chats.deleteChatConfirmMessage')}
        icon="trash-outline"
        iconColor={colors.error}
        primaryButton={{
          label: t('chats.deleteChatCta'),
          onPress: handleDeleteChat,
          variant: 'danger',
          loading: deleting,
        }}
        secondaryButton={{
          label: t('chats.cancelCta'),
          onPress: () => setDeleteConfirmVisible(false),
          variant: 'neutral',
          disabled: deleting,
        }}
        onDismiss={() => !deleting && setDeleteConfirmVisible(false)}
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
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionSpaced: {
    marginTop: spacing.sm,
  },
  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
  },
  rowLabel: {
    flex: 1,
  },
  destructiveLabel: {
    // Custom `color` on `Text` needs `opacity: 1`, or the tone opacity
    // mutes the red (components/ui/text.tsx).
    color: colors.error,
    opacity: 1,
  },
});
