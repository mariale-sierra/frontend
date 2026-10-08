import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../ui/bottomSheetModal';
import { SearchBar } from '../ui/searchBar';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useAuth } from '../../hooks/useAuth';
import { getConversations, getOrCreateConversation, sendMessage } from '../../services/chats/chats.service';
import { searchUsers } from '../../services/user/user.service';
import type { SharedContentPayload } from '../../types/chat';

interface ShareToChatSheetProps {
  visible: boolean;
  onClose: () => void;
  /** What to share — a post or a challenge (Sprint 10, B5). */
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

type SendState = 'sending' | 'sent' | 'error';

const SEARCH_DEBOUNCE_MS = 350;

/**
 * "Send to…" sheet for sharing a post or a challenge inside Havit's own 1:1
 * chats. Lists the viewer's recent conversations (minus message requests they
 * haven't accepted — they can't send there yet) and lets them search anyone
 * else. Each row sends on tap and then shows "Sent", so the same post can go
 * to several people without reopening the sheet.
 */
export function ShareToChatSheet({ visible, onClose, content, onShareExternally }: ShareToChatSheetProps) {
  const { t } = useTranslation();
  const { userId } = useAuth();
  const [recent, setRecent] = useState<Recipient[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendState, setSendState] = useState<Record<string, SendState>>({});

  // Fresh state every time the sheet opens — "Sent" marks belong to one
  // share, not to the next post shared from the same screen.
  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setResults([]);
    setSendState({});
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

  async function handleSend(recipient: Recipient) {
    const current = sendState[recipient.userId];
    if (current === 'sending' || current === 'sent') return;
    setSendState((prev) => ({ ...prev, [recipient.userId]: 'sending' }));
    try {
      const conversationId = recipient.conversationId ?? (await getOrCreateConversation(recipient.userId)).id;
      await sendMessage(conversationId, '', content);
      setSendState((prev) => ({ ...prev, [recipient.userId]: 'sent' }));
    } catch {
      // The global api.ts interceptor already shows the error toast.
      setSendState((prev) => ({ ...prev, [recipient.userId]: 'error' }));
    }
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

        {!searchingMode && (
          <Text variant="caption" tone="secondary" style={styles.sectionLabel}>
            {t('share.recentChats')}
          </Text>
        )}

        {(searchingMode ? searching : loadingRecent) ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            style={styles.flexFill}
            data={rows}
            keyExtractor={(item) => item.userId}
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
              <RecipientRow recipient={item} state={sendState[item.userId]} onSend={() => handleSend(item)} />
            )}
          />
        )}
      </View>
    </BottomSheetModal>
  );
}

function RecipientRow({
  recipient,
  state,
  onSend,
}: {
  recipient: Recipient;
  state: SendState | undefined;
  onSend: () => void;
}) {
  const { t } = useTranslation();
  const sent = state === 'sent';

  return (
    <Row align="center" gap="md" style={styles.recipientRow}>
      <UserAvatar username={recipient.username} imageUrl={recipient.imageUrl} size={44} />
      <View style={styles.recipientInfo}>
        <Text variant="body" weight="bold" numberOfLines={1}>
          {recipient.displayName || `@${recipient.username}`}
        </Text>
        {recipient.displayName ? (
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            @{recipient.username}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onSend}
        disabled={state === 'sending' || sent}
        accessibilityRole="button"
        accessibilityLabel={t('share.sendToA11y', { name: recipient.displayName || recipient.username })}
        style={[styles.sendButton, sent && styles.sendButtonSent]}
        testID={`share-send-${recipient.userId}`}
      >
        {state === 'sending' ? (
          <ActivityIndicator size="small" color={colors.ink} />
        ) : (
          <Text variant="caption" weight="bold" inverse={!sent}>
            {sent ? t('share.sent') : state === 'error' ? t('share.retry') : t('share.send')}
          </Text>
        )}
      </Pressable>
    </Row>
  );
}

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
    backgroundColor: withAlpha(colors.paper, 0.08),
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  list: {
    paddingBottom: spacing['2xl'],
  },
  recipientRow: {
    paddingVertical: spacing.xs,
  },
  recipientInfo: {
    flex: 1,
    gap: 2,
  },
  sendButton: {
    minWidth: 76,
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendButtonSent: {
    backgroundColor: withAlpha(colors.paper, 0.08),
  },
  center: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
