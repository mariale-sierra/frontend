import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
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
import { SpaceCard } from '../../components/spaces/SpaceCard';
import { useConversations } from '../../hooks/useConversations';
import { useSpaces } from '../../hooks/useSpaces';
import { useAuth } from '../../hooks/useAuth';
import { joinSpace } from '../../services/spaces/spaces.service';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { SpaceContract } from '../../types/space';

const SPACES_PREVIEW_COUNT = 2;

/**
 * Matches the Chats-46A wireframe's layout — search bar + compose FAB up
 * top, a "Spaces" section, then a "Messages" section below (its own
 * eyebrow-style header, matching the wireframe's Bebas Neue section title +
 * small people icon). No screen title above the search bar — the wireframe
 * doesn't have one either, relying on the chat-bubble icon the user tapped
 * to get here for context.
 *
 * Spaces now has a real backend (Sprint 8, Bloque 2) — this section shows
 * up to SPACES_PREVIEW_COUNT joinable spaces (loading/error/empty states,
 * same ladder as Messages below) with a "See all" link to the full
 * `/messaging/spaces` list once there are more than that.
 *
 * The compose FAB now opens a small chooser (New message / Create space)
 * instead of jumping straight to `/messaging/new`, per the wireframe's own
 * "opens New message / Create space" note — collapsed to a direct push
 * before Spaces had a backend to create against.
 */
export default function Messaging() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const { conversations, loading, error, reload } = useConversations();
  const { spaces, loading: spacesLoading, error: spacesError, reload: reloadSpaces } = useSpaces();
  const [query, setQuery] = useState('');
  const [composeMenuVisible, setComposeMenuVisible] = useState(false);
  const [joiningSpaceId, setJoiningSpaceId] = useState<string | null>(null);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const { username, displayName } = c.otherParticipant;
      return username.toLowerCase().includes(q) || (displayName ?? '').toLowerCase().includes(q);
    });
  }, [conversations, query]);

  const spacesPreview = spaces.slice(0, SPACES_PREVIEW_COUNT);

  async function handleJoinSpace(space: SpaceContract) {
    setJoiningSpaceId(space.id);
    try {
      await joinSpace(space.id);
      reloadSpaces();
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setJoiningSpaceId(null);
    }
  }

  return (
    <ScreenBackground variant="default">
      <Row align="center" gap="sm" style={styles.header}>
        <BackButton style={styles.backButton} />
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={t('chats.searchPlaceholder')} />
        </View>
        <IconButton
          name="paper-plane-outline"
          size={48}
          iconSize={22}
          iconColor={colors.ink}
          style={styles.composeButton}
          onPress={() => setComposeMenuVisible(true)}
          accessibilityLabel={t('chats.composeA11y')}
        />
      </Row>

      <Row align="center" gap="xs" style={styles.sectionHeader}>
        <Text variant="subheader">{t('chats.spacesTitle')}</Text>
      </Row>
      {spacesLoading ? (
        <View style={styles.spacesEmptyCard}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : spacesError ? (
        <View style={styles.spacesEmptyCard}>
          <Text variant="body" tone="secondary" align="center">
            {t('spaces.loadError')}
          </Text>
        </View>
      ) : spaces.length === 0 ? (
        <View style={styles.spacesEmptyCard}>
          <Icon name="layers-outline" size={28} color={withAlpha(colors.paper, textOpacity.tertiary)} />
          <Text variant="body" tone="secondary" align="center">
            {t('chats.spacesEmptyState')}
          </Text>
        </View>
      ) : (
        <View style={styles.spacesPreviewList}>
          {spacesPreview.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              onPress={() => router.push(`/messaging/spaces/${space.id}`)}
              onPressCta={() => handleJoinSpace(space)}
              ctaLoading={joiningSpaceId === space.id}
            />
          ))}
          {spaces.length > SPACES_PREVIEW_COUNT && (
            <Pressable onPress={() => router.push('/messaging/spaces')} style={styles.seeAllRow}>
              <Text variant="label" weight="bold">
                {t('spaces.seeAll')}
              </Text>
              <Icon name="chevron-forward-outline" size={16} color={colors.paper} />
            </Pressable>
          )}
        </View>
      )}

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
                    otherUserId: item.otherParticipant.id,
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

      <Modal
        visible={composeMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setComposeMenuVisible(false)}
      >
        <Pressable style={styles.composeBackdrop} onPress={() => setComposeMenuVisible(false)}>
          <View style={styles.composeMenu}>
            <Pressable
              style={styles.composeMenuRow}
              onPress={() => {
                setComposeMenuVisible(false);
                router.push('/messaging/new');
              }}
            >
              <Icon name="chatbubble-outline" size={20} color={colors.paper} />
              <Text variant="body" weight="bold">
                {t('chats.newMessageTitle')}
              </Text>
            </Pressable>
            <Divider marginVertical="xs" />
            <Pressable
              style={styles.composeMenuRow}
              onPress={() => {
                setComposeMenuVisible(false);
                router.push('/messaging/spaces/create');
              }}
            >
              <Icon name="add-circle-outline" size={20} color={colors.paper} />
              <Text variant="body" weight="bold">
                {t('spaces.createCta')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  spacesEmptyCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  spacesPreviewList: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
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
  composeBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: withAlpha(colors.ink, 0.75),
  },
  composeMenu: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.big,
    borderTopRightRadius: radius.big,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  composeMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
