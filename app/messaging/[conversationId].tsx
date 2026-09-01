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
import { colors, spacing } from '../../constants/theme';
import type { MessageContract } from '../../types/chat';

export default function Chat() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const { conversationId, otherUserId, otherUsername, otherDisplayName, otherProfileImageUrl } =
    useLocalSearchParams<{
      conversationId: string;
      otherUserId?: string;
      otherUsername?: string;
      otherDisplayName?: string;
      otherProfileImageUrl?: string;
    }>();

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
          <UserAvatar username={otherUsername ?? ''} imageUrl={otherProfileImageUrl || null} size={32} />
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <MessageBubble message={item} isMine={item.senderId === userId} />
            )}
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

          <Row align="center" gap="sm" style={styles.inputRow}>
            <Input
              containerStyle={styles.input}
              variant="filled"
              placeholder={t('chats.inputPlaceholder')}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={2000}
            />
            <IconButton
              name="send"
              variant="surface"
              onPress={handleSend}
              disabled={sending || !draft.trim()}
            />
          </Row>
        </KeyboardAvoidingView>
      )}
    </ScreenBackground>
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
  inputRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  input: {
    flex: 1,
  },
});
