import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { IconButton } from '../../components/ui/iconButton';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { SearchBar } from '../../components/ui/searchBar';
import { Row } from '../../components/layout/row';
import { Divider } from '../../components/ui/divider';
import { ConversationListItem } from '../../components/chats/ConversationListItem';
import { useConversations } from '../../hooks/useConversations';
import { useAuth } from '../../hooks/useAuth';
import { colors, radius, spacing } from '../../constants/theme';

/**
 * Matches the Chats-46A wireframe's layout — search bar + compose FAB up
 * top, a "Messages" section below (its own eyebrow-style header, matching
 * the wireframe's Bebas Neue section title + small people icon). No screen
 * title above the search bar — the wireframe doesn't have one either,
 * relying on the chat-bubble icon the user tapped to get here for context.
 *
 * The wireframe ALSO has a "Spaces" section above Messages (joinable/
 * requestable group chats, each tagged with its own activity color) — NOT
 * built here. Per explicit instruction: Spaces has no backend at all yet
 * (its tables exist in the schema — `spaces`/`space_members`/
 * `space_messages` — but chats.service.ts's own doc comment confirms no
 * service/controller was built against them, deliberately out of scope of
 * the 1:1 chats module that shipped). Faking that section with placeholder
 * cards would misrepresent it as real, working data, which it isn't — same
 * "don't fabricate what the backend doesn't provide" rule this app follows
 * everywhere else. Only the Messages section (real, live data) is built.
 *
 * The compose FAB's wireframe behavior is "opens New message / Create
 * space" — collapsed to a direct `/messaging/new` push (skipping a menu for
 * a single real option) for the same reason: Create Space has nothing to
 * open onto yet.
 */
export default function Messaging() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const { conversations, loading, error, reload } = useConversations();
  const [query, setQuery] = useState('');

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const { username, displayName } = c.otherParticipant;
      return username.toLowerCase().includes(q) || (displayName ?? '').toLowerCase().includes(q);
    });
  }, [conversations, query]);

  return (
    <ScreenBackground variant="default">
      <Row align="center" gap="sm" style={styles.header}>
        <BackButton style={styles.backButton} />
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={t('chats.searchPlaceholder')} />
        </View>
        <IconButton
          name="create-outline"
          size={48}
          iconSize={22}
          iconColor={colors.ink}
          style={styles.composeButton}
          onPress={() => router.push('/messaging/new')}
          accessibilityLabel={t('chats.composeA11y')}
        />
      </Row>

      <Row align="center" gap="xs" style={styles.sectionHeader}>
        <Text variant="subheader">{t('chats.title')}</Text>
        <Icon name="people-outline" size={20} color={colors.paper} />
      </Row>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('chats.loadError')}</Text>
          <Button variant="outline" size="sm" onPress={reload}>
            {t('common.actions.continue')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              currentUserId={userId}
              onPress={() =>
                router.push({
                  pathname: '/messaging/[conversationId]',
                  params: {
                    conversationId: item.id,
                    otherUsername: item.otherParticipant.username,
                    otherDisplayName: item.otherParticipant.displayName ?? '',
                    otherProfileImageUrl: item.otherParticipant.profileImageUrl ?? '',
                  },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <Divider marginVertical="xs" />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="secondary">
                {query.trim() ? t('chats.noResultsForSearch') : t('chats.emptyState')}
              </Text>
            </View>
          }
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  searchWrap: {
    flex: 1,
  },
  composeButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.big,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
