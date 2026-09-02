import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { Icon } from '../../components/ui/icon';
import { UserAvatar } from '../../components/ui/userAvatar';
import { Row } from '../../components/layout/row';
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
 * Only the real, backend-backed action from that wireframe is built here:
 * "View profile", a plain navigation to the existing `/profile/[userId]`
 * screen (real data, already used elsewhere — `FollowListItem`). The
 * wireframe's "Delete chat" action is deliberately NOT built: there is no
 * DELETE endpoint anywhere on `/chats/conversations`
 * (`chats.controller.ts` only has POST/GET conversations, GET/POST
 * messages, PATCH read) — a delete button here would either silently do
 * nothing or need a fake confirmation, which this app avoids everywhere
 * else it doesn't have real backend support. Same reasoning covers the
 * thread header's own "Active now" presence pill (no online/presence data
 * anywhere in the backend) — left out rather than faked.
 */
export default function ChatDetails() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
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

  const name = otherDisplayName || (otherUsername ? `@${otherUsername}` : '');

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
  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
  },
  rowLabel: {
    flex: 1,
  },
});
