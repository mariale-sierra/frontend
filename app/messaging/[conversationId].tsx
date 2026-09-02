import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { IconButton } from '../../components/ui/iconButton';
import { UserAvatar } from '../../components/ui/userAvatar';
import { Row } from '../../components/layout/row';
import { MessageBubble } from '../../components/chats/MessageBubble';
import { useConversationMessages } from '../../hooks/useConversationMessages';
import { useAuth } from '../../hooks/useAuth';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getDaySeparator, isDifferentDay } from '../../utils/time';
import type { MessageContract } from '../../types/chat';

const HEADER_AVATAR_SIZE = 40;
// Shrunk from 48, per explicit "row is too tall" request — happens to land
// on the same 40 as the header avatar above, but that's coincidental, not
// shared meaning, so it gets its own constant rather than reusing that one.
const SEND_BUTTON_SIZE = 40;

export default function Chat() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{
    conversationId: string;
    otherUserId?: string | string[];
    otherUsername?: string | string[];
    otherDisplayName?: string | string[];
    otherProfileImageUrl?: string | string[];
  }>();
  const { conversationId } = params;
  // expo-router params can come back as string[] — same unwrap
  // `app/profile/[userId].tsx` already does — before this got applied here
  // too, a bad shape meant the ⋯ menu could forward a mangled id to Chat
  // details → "View profile", which the backend then rejected as an
  // invalid UUID ("Validation failed" toast). Real, reported bug.
  const unwrap = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const otherUserId = unwrap(params.otherUserId);
  const otherUsername = unwrap(params.otherUsername);
  const otherDisplayName = unwrap(params.otherDisplayName);
  const otherProfileImageUrl = unwrap(params.otherProfileImageUrl);

  const {
    messages,
    loading,
    error,
    sending,
    hasMore,
    loadingOlder,
    loadOlder,
    send,
    reload,
  } = useConversationMessages(conversationId);

  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<MessageContract>>(null);

  const name = otherDisplayName || (otherUsername ? `@${otherUsername}` : '');
  const otherAvatar = { username: otherUsername ?? '', imageUrl: otherProfileImageUrl || null };

  const handleSend = useCallback(async () => {
    if (!draft.trim()) return;
    const toSend = draft;
    setDraft('');
    await send(toSend);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [draft, send]);

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Row align="center" gap="sm" style={styles.headerInfo} justify="flex-start">
          <UserAvatar username={otherUsername ?? ''} imageUrl={otherProfileImageUrl || null} size={HEADER_AVATAR_SIZE} />
          <Text variant="body" weight="bold" numberOfLines={1} style={styles.headerName}>
            {name}
          </Text>
        </Row>
        {/* Chats-47A's header also shows an "Active now" presence indicator
            next to the name — no online/presence data exists anywhere in
            the backend (chats or otherwise), so it's left out rather than
            faked as always-on or always-off. */}
        <IconButton
          name="ellipsis-horizontal"
          size={44}
          iconSize={20}
          iconColor={colors.paper}
          onPress={() =>
            router.push({
              pathname: '/messaging/chat-details',
              params: { otherUserId: otherUserId ?? '', otherUsername: otherUsername ?? '', otherDisplayName: otherDisplayName ?? '', otherProfileImageUrl: otherProfileImageUrl ?? '' },
            })
          }
          accessibilityLabel={t('chats.optionsA11y')}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('chats.threadLoadError')}</Text>
          <Button variant="outline" size="sm" onPress={reload}>
            {t('common.actions.continue')}
          </Button>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          // Real, reported bug, twice over: a flat hardcoded 90 (pre-existing,
          // from before this session's redesign) left a large gap above the
          // keyboard. The fix wasn't a bigger/smarter offset, though — on
          // iOS, `padding` behavior already measures this view's own actual
          // on-screen position (via `measureInWindow`), which already
          // accounts for everything rendered above it (the header, the
          // safe-area inset). Adding `insets.top + headerHeight` on top of
          // that (the previous attempt here) double-counted the same space
          // RN was already compensating for automatically — an even bigger
          // gap, not a smaller one. `keyboardVerticalOffset` is only meant
          // for space the automatic measurement CAN'T see (e.g. a
          // translucent bar outside the view tree) — this screen has none,
          // so 0 is correct.
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => {
              const previous = messages[index - 1];
              const showDaySeparator = !previous || isDifferentDay(previous.sentAt, item.sentAt);
              const isMine = item.senderId === userId;
              return (
                <>
                  {showDaySeparator && <DaySeparator iso={item.sentAt} t={t} />}
                  <MessageBubble message={item} isMine={isMine} otherAvatar={isMine ? undefined : otherAvatar} />
                </>
              );
            }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListHeaderComponent={
              hasMore ? (
                <Button
                  variant="outline"
                  size="sm"
                  loading={loadingOlder}
                  onPress={loadOlder}
                  style={styles.loadOlderButton}
                >
                  {t('chats.loadOlderMessages')}
                </Button>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text tone="secondary">{t('chats.noMessagesYet')}</Text>
              </View>
            }
          />

          <View style={styles.inputBar}>
            {/* `justify="flex-start"` + wrapping `Input` in its own
                `flex:1` View — `Row` defaults to `space-between`, and
                `Input`'s OWN outer wrapper (its `containerStyle` prop only
                reaches the inner pill, not that wrapper) has no flex of its
                own, so with nothing forcing it to grow it collapsed to the
                width of an empty `TextInput` — a real, reported "the input
                is tiny/doesn't work" bug, not a cosmetic one. */}
            <Row align="center" gap="sm" justify="flex-start">
              <View style={styles.inputWrapper}>
                <Input
                  containerStyle={styles.input}
                  style={styles.inputText}
                  placeholderVariant="caption"
                  placeholder={t('chats.messagePlaceholder', { name })}
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  maxLength={2000}
                  showCounter={false}
                />
              </View>
              <IconButton
                name="send"
                size={SEND_BUTTON_SIZE}
                iconSize={18}
                iconColor={colors.ink}
                style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={sending || !draft.trim()}
              />
            </Row>
          </View>
        </KeyboardAvoidingView>
      )}
    </ScreenBackground>
  );
}

/**
 * Chats-47A's centered "TODAY" pill above the first message of each
 * calendar day — `Text`'s own `header` variant (bold, uppercase, small
 * DM Sans) already matches the wireframe's pill typography exactly, so
 * this only adds the pill container around it.
 */
function DaySeparator({ iso, t }: { iso: string; t: (key: string) => string }) {
  const separator = getDaySeparator(iso);
  const label =
    separator.kind === 'today' ? t('chats.today') : separator.kind === 'yesterday' ? t('chats.yesterday') : separator.label;

  return (
    <View style={styles.daySeparatorWrap}>
      <View style={styles.daySeparatorPill}>
        <Text variant="header" tone="secondary">
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    flexShrink: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  loadOlderButton: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  inputBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
    paddingHorizontal: spacing.lg,
    // Tightened from sm/md, per explicit "row is too tall" request.
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  // Input's own base TextInput style zeroes `paddingVertical` and sets
  // `includeFontPadding: false` (Android) — without any padding to
  // compensate, the placeholder/typed text visually anchors to the very
  // top of the pill instead of centering. Real, reported bug — this
  // `style` prop reaches the TextInput itself (last in Input's own style
  // array, so it wins over that zeroed base).
  inputText: {
    // Asymmetric on purpose: the top-anchoring bug (see comment above) only
    // needs to be countered from the TOP, so more `paddingTop` than
    // `paddingBottom` recenters the text with less total added height than
    // bumping `paddingVertical` symmetrically would — the previous
    // symmetric `spacing.xs` wasn't enough top offset after the row got
    // tightened, but going back to symmetric `spacing.sm` would undo that
    // tightening.
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    // A small nudge off the pill's edge — Input's own base container
    // already insets it via `paddingHorizontal: spacing.md`; this stacks
    // `spacing.xs` (the scale's smallest step) on top for a touch more
    // breathing room, rather than a raw pixel value.
    paddingLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.ink,
    borderRadius: radius.big,
    // Tightened from Input's own default `spacing.md`, per explicit "row is
    // too tall" request — paired with the smaller `sendButton` below so the
    // pill and the button land on close to the same height.
    paddingVertical: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.paper,
    borderRadius: radius.big,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  daySeparatorWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  daySeparatorPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
});
