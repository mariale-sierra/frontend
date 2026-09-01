import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { SearchBar } from '../../components/ui/searchBar';
import { UserAvatar } from '../../components/ui/userAvatar';
import { Row } from '../../components/layout/row';
import { Divider } from '../../components/ui/divider';
import { searchUsers } from '../../services/user/user.service';
import { getOrCreateConversation } from '../../services/chats/chats.service';
import { colors, spacing } from '../../constants/theme';
import type { PublicProfileContract } from '../../types/user';
import type { ConversationSummaryContract } from '../../types/chat';

/**
 * Two shapes in one screen, per whether a `recipientUserId` param is given:
 *
 * 1. WITH `recipientUserId` — an existing entry point already used
 *    elsewhere (e.g. `FeedPostCard`'s "Send message"), where the caller
 *    already knows who to message. Resolves (or reuses) the conversation
 *    and hands off to the real thread screen immediately — nothing to pick.
 * 2. WITHOUT it — the compose-FAB entry point from `app/messaging/index.tsx`
 *    (Chats-46A wireframe's "New message" action), where the user needs to
 *    search for who to message first. Same search-by-username pattern
 *    `app/challenge/[id]/invite.tsx` already established (SearchBar +
 *    debounced `searchUsers`), reused rather than reinvented — tapping a
 *    result resolves/creates the conversation the same way case 1 does.
 */
export default function NewConversation() {
  const { t } = useTranslation();
  const router = useRouter();
  const { recipientUserId } = useLocalSearchParams<{ recipientUserId?: string }>();
  const [error, setError] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicProfileContract[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const openConversation = (conversation: ConversationSummaryContract) => {
    router.replace({
      pathname: '/messaging/[conversationId]',
      params: {
        conversationId: conversation.id,
        otherUsername: conversation.otherParticipant.username,
        otherDisplayName: conversation.otherParticipant.displayName ?? '',
        otherProfileImageUrl: conversation.otherParticipant.profileImageUrl ?? '',
      },
    });
  };

  // Case 1 — a known recipient, resolve and hand off immediately.
  useEffect(() => {
    if (!recipientUserId) return;

    let cancelled = false;
    getOrCreateConversation(recipientUserId)
      .then((conversation) => {
        if (cancelled) return;
        openConversation(conversation);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [recipientUserId]);

  // Case 2 — debounced username search, same 350ms/timeout shape invite.tsx
  // already uses against this same GET /users/search endpoint.
  useEffect(() => {
    if (recipientUserId) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      searchUsers(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query, recipientUserId]);

  const handlePickUser = (user: PublicProfileContract) => {
    if (startingId) return;
    setStartingId(user.id);
    getOrCreateConversation(user.id)
      .then((conversation) => openConversation(conversation))
      .catch(() => {
        setStartingId(null);
        setError(true);
      });
  };

  if (recipientUserId) {
    return (
      <ScreenBackground variant="default">
        <View style={styles.header}>
          <BackButton />
        </View>
        <View style={styles.center}>
          {error ? (
            <Text tone="secondary">{t('chats.startConversationError')}</Text>
          ) : (
            <>
              <ActivityIndicator color={colors.primary} />
              <Text tone="secondary">{t('chats.startingConversation')}</Text>
            </>
          )}
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('chats.newMessageTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder={t('invites.searchPlaceholder')} />
      </View>

      {error && (
        <View style={styles.center}>
          <Text tone="secondary">{t('chats.startConversationError')}</Text>
        </View>
      )}

      {searching ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(user) => user.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <Divider marginVertical="xs" />}
          ListEmptyComponent={
            query.trim() ? (
              <View style={styles.center}>
                <Text tone="secondary">{t('invites.searchEmpty')}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Row
              align="center"
              gap="md"
              style={styles.userRow}
              pressable
              onPress={() => handlePickUser(item)}
            >
              <UserAvatar username={item.username} imageUrl={item.profile_image_url} size={44} />
              <View style={styles.userInfo}>
                <Text variant="body" weight="bold" numberOfLines={1}>
                  {item.display_name}
                </Text>
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  @{item.username}
                </Text>
              </View>
              {startingId === item.id && <ActivityIndicator color={colors.primary} />}
            </Row>
          )}
        />
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
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  userRow: {
    paddingVertical: spacing.xs,
  },
  userInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  center: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
