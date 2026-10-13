import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../ui/bottomSheetModal';
import { SearchBar } from '../ui/searchBar';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { Button } from '../ui/button';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { borderWidth, colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { STREAK_GRID_COLUMNS } from '../../constants/streaksGrid';
import { getStreakGridLayout } from '../../utils/streaksGrid';
import { withAlpha } from '../../utils/color';
import { useAuth } from '../../hooks/useAuth';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { getConversations, getOrCreateConversation, sendMessage } from '../../services/chats/chats.service';
import { searchUsers } from '../../services/user/user.service';
import type { SharedContentPayload } from '../../types/chat';

interface ShareToChatSheetProps {
  visible: boolean;
  onClose: () => void;
  /** What to share — a post or a challenge (Sprint 9, B5). */
  content: SharedContentPayload;
  /** Optional extra row for the native share sheet (WhatsApp, Instagram…). */
  onShareExternally?: () => void;
}

/** One person to send to — from a recent conversation, or a user search. */
interface Recipient {
  userId: string;
  username: string;
  displayName: string | null;
  imageUrl: string | null;
  /** Known only for a recent conversation; a searched user resolves (or
   * creates) theirs on send. */
  conversationId?: string;
}

const SEARCH_DEBOUNCE_MS = 350;
// Same three-to-a-row grid as Streaks, but smaller faces (explicit request:
// Streaks' 80%-of-the-column avatars were too big for a picker).
const SHARE_AVATAR_SHARE = 0.6;

/**
 * "Send to…" sheet for sharing a post or a challenge inside Havit's own 1:1
 * chats. Lists the viewer's recent conversations (minus message requests they
 * haven't accepted — they can't send there yet) and lets them search anyone
 * else, laid out like the Streaks grid (round avatar + username, three to a
 * row). Tapping people selects them (several at once, kept across searches);
 * the Send button appears at the bottom once someone is selected, and only
 * that sends. All sent: the sheet closes with a toast. Some failed: those stay
 * selected, marked in red, and the button becomes Retry.
 */
export function ShareToChatSheet({ visible, onClose, content, onShareExternally }: ShareToChatSheetProps) {
  const { t } = useTranslation();
  const { userId } = useAuth();
  const showSuccess = useErrorNotificationStore((state) => state.showSuccess);
  const { width } = useWindowDimensions();
  // The sheet's side padding is the same `spacing.lg` as the Streaks screen,
  // so its column math applies unchanged.
  const { columnWidth } = getStreakGridLayout(width);
  const avatarSize = Math.floor(columnWidth * SHARE_AVATAR_SHARE);

  const [recent, setRecent] = useState<Recipient[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Record<string, Recipient>>({});
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  // Fresh state every time the sheet opens — a selection belongs to one
  // share, not to the next post shared from the same screen.
  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setResults([]);
    setSelected({});
    setFailed(new Set());
    setSending(false);
    setLoadingRecent(true);
    let cancelled = false;
    getConversations()
      .then((conversations) => {
        if (cancelled) return;
        setRecent(
          conversations
            .filter((c) => !c.isPending)
            .map((c) => ({
              userId: c.otherParticipant.id,
              username: c.otherParticipant.username,
              displayName: c.otherParticipant.displayName,
              imageUrl: c.otherParticipant.profileImageUrl,
              conversationId: c.id,
            })),
        );
      })
      .catch(() => {
        if (!cancelled) setRecent([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecent(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      searchUsers(q)
        .then((users) =>
          setResults(
            users
              .filter((u) => u.id !== userId)
              .map((u) => ({
                userId: u.id,
                username: u.username,
                displayName: u.display_name || null,
                imageUrl: u.profile_image_url,
              })),
          ),
        )
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query, userId]);

  const searchingMode = query.trim().length > 0;
  const rows = useMemo(() => {
    if (!searchingMode) return recent;
    // A searched user who's already a recent chat keeps that chat's id.
    const recentByUser = new Map(recent.map((r) => [r.userId, r]));
    return results.map((r) => recentByUser.get(r.userId) ?? r);
  }, [searchingMode, recent, results]);

  const selectedList = Object.values(selected);

  function toggle(recipient: Recipient) {
    if (sending) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[recipient.userId]) delete next[recipient.userId];
      else next[recipient.userId] = recipient;
      return next;
    });
    setFailed((prev) => {
      if (!prev.has(recipient.userId)) return prev;
      const next = new Set(prev);
      next.delete(recipient.userId);
      return next;
    });
  }

  async function handleSend() {
    if (sending || selectedList.length === 0) return;
    setSending(true);
    const outcomes = await Promise.all(
      selectedList.map(async (recipient) => {
        try {
          const conversationId = recipient.conversationId ?? (await getOrCreateConversation(recipient.userId)).id;
          await sendMessage(conversationId, '', content);
          return { recipient, ok: true };
        } catch {
          // The global api.ts interceptor already shows the error toast.
          return { recipient, ok: false };
        }
      }),
    );
    setSending(false);

    const failedOnes = outcomes.filter((o) => !o.ok).map((o) => o.recipient);
    if (failedOnes.length === 0) {
      showSuccess({ message: t('share.sentToast', { count: outcomes.length }) });
      onClose();
      return;
    }
    // Keep only the ones that failed selected, so the button retries just them.
    setSelected(Object.fromEntries(failedOnes.map((r) => [r.userId, r])));
    setFailed(new Set(failedOnes.map((r) => r.userId)));
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} glass height="70%">
      <View style={styles.flexFill}>
        <Text variant="subheader" align="center" style={styles.title}>
          {t('share.title')}
        </Text>

        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={t('share.searchPlaceholder')} />
        </View>

        {onShareExternally ? (
          <Row
            pressable
            onPress={onShareExternally}
            gap="md"
            align="center"
            justify="flex-start"
            style={styles.externalRow}
            accessibilityRole="button"
            testID="share-externally"
          >
            <View style={styles.externalIcon}>
              <Icon name="share-social-outline" size={20} color={colors.paper} />
            </View>
            <Text variant="body" weight="bold">
              {t('share.otherApps')}
            </Text>
          </Row>
        ) : null}

        {(searchingMode ? searching : loadingRecent) ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            style={styles.flexFill}
            data={rows}
            keyExtractor={(item) => item.userId}
            numColumns={STREAK_GRID_COLUMNS}
            columnWrapperStyle={styles.gridRow}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text tone="secondary" align="center">
                  {searchingMode ? t('invites.searchEmpty') : t('share.noRecentChats')}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <RecipientTile
                recipient={item}
                selected={!!selected[item.userId]}
                failed={failed.has(item.userId)}
                onPress={() => toggle(item)}
                columnWidth={columnWidth}
                avatarSize={avatarSize}
              />
            )}
          />
        )}

        {/* Only once someone is picked — sending happens here, not on the tap. */}
        {selectedList.length > 0 ? (
          <View style={styles.footer}>
            <Button size="md" loading={sending} onPress={handleSend} testID="share-send">
              {failed.size > 0
                ? t('share.retry')
                : selectedList.length === 1
                  ? t('share.send')
                  : t('share.sendCount', { count: selectedList.length })}
            </Button>
          </View>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}

function RecipientTile({
  recipient,
  selected,
  failed,
  onPress,
  columnWidth,
  avatarSize,
}: {
  recipient: Recipient;
  selected: boolean;
  failed: boolean;
  onPress: () => void;
  columnWidth: number;
  avatarSize: number;
}) {
  const { t } = useTranslation();
  const name = recipient.displayName || recipient.username;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={t('share.sendToA11y', { name })}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [styles.tile, { width: columnWidth }, pressed && styles.pressed]}
      testID={`share-pick-${recipient.userId}`}
    >
      <View style={[styles.avatarRing, { borderRadius: avatarSize }, selected && styles.avatarRingSelected]}>
        <UserAvatar username={recipient.username} imageUrl={recipient.imageUrl} size={avatarSize} circle />
      </View>
      {selected ? (
        <View style={[styles.stateBadge, failed ? styles.stateBadgeFailed : styles.stateBadgeSelected]}>
          <Icon name={failed ? 'refresh' : 'checkmark'} size={14} color={colors.ink} />
        </View>
      ) : null}
      <Text
        variant="caption"
        tone={selected ? 'primary' : 'secondary'}
        numberOfLines={1}
        style={[styles.name, { width: columnWidth }]}
      >
        @{recipient.username}
      </Text>
    </Pressable>
  );
}

// Room the selection ring takes around an avatar.
const RING_WIDTH = borderWidth.thin * 2;

const styles = StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  title: {
    marginBottom: spacing.md,
  },
  searchWrap: {
    paddingBottom: spacing.md,
  },
  externalRow: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  externalIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
  },
  list: {
    paddingBottom: spacing.lg,
  },
  gridRow: {
    marginBottom: spacing.lg,
  },
  tile: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  // A transparent ring that turns `primary` when selected, so picking someone
  // doesn't shift the avatar.
  avatarRing: {
    borderWidth: RING_WIDTH,
    borderColor: 'transparent',
    padding: RING_WIDTH,
  },
  avatarRingSelected: {
    borderColor: colors.primary,
  },
  // A small check on the avatar's top-right, ringed in the background color.
  stateBadge: {
    position: 'absolute',
    top: 0,
    right: '20%',
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: RING_WIDTH,
    borderColor: colors.ink,
  },
  stateBadgeSelected: {
    backgroundColor: colors.primary,
  },
  stateBadgeFailed: {
    backgroundColor: colors.error,
  },
  name: {
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.md,
  },
  center: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
