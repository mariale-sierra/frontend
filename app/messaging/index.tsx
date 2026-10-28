import { EmptyState } from '../../components/ui/emptyState';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
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
import { CoachMark } from '../../components/onboarding/CoachMark';
import { ConversationListItem } from '../../components/chats/ConversationListItem';
import { SpaceCard } from '../../components/spaces/SpaceCard';
import { SpaceCardSkeleton } from '../../components/spaces/SpaceCardSkeleton';
import { SpaceThreadListItem } from '../../components/spaces/SpaceThreadListItem';
import { MessageRowSkeleton } from '../../components/chats/MessageRowSkeleton';
import { useConversations } from '../../hooks/useConversations';
import { useSpaces } from '../../hooks/useSpaces';
import { useSpaceThreadPreviews } from '../../hooks/useSpaceThreadPreviews';
import type { SpaceThreadPreview } from '../../hooks/useSpaceThreadPreviews';
import { useAuth } from '../../hooks/useAuth';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { joinSpace } from '../../services/spaces/spaces.service';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { hasSeenComposeCoachMark, markComposeCoachMarkSeen } from '../../utils/composeCoachMark';
import { FORCE_SHOW_ONBOARDING_PREVIEWS } from '../../constants/onboardingDebug';
import type { ConversationSummaryContract } from '../../types/chat';
import type { SpaceContract } from '../../types/space';

const SPACES_PREVIEW_COUNT = 2;

type MessagingRow =
  | { kind: 'conversation'; key: string; timestamp: number; conversation: ConversationSummaryContract }
  | { kind: 'space'; key: string; timestamp: number; preview: SpaceThreadPreview };

/**
 * Matches the Chats-46A wireframe's layout — search bar + compose FAB up
 * top, a "Spaces" section, then a "Messages" section below (its own
 * eyebrow-style header, matching the wireframe's Bebas Neue section title +
 * small people icon). No screen title above the search bar — the wireframe
 * doesn't have one either, relying on the chat-bubble icon the user tapped
 * to get here for context.
 *
 * Spaces now has a real backend (Sprint 8, Bloque 2) — this section shows
 * up to SPACES_PREVIEW_COUNT NOT-YET-joined spaces to explore (loading/
 * error/empty states, same ladder as Messages below) with a "See all" link
 * to the full `/messaging/spaces` list once there are more than that. Per
 * the wireframe's own note: joining a space (or being approved into one)
 * removes its card from here — it's no longer something to discover, it's
 * now a conversation — and it moves down into Messages instead, merged in
 * and sorted alongside 1:1 conversations by whichever had the most recent
 * activity (`SpaceThreadListItem`, own row shape since it needs a
 * space-shaped preview, not a `ConversationSummaryContract`).
 *
 * The compose button offers New message / Create space, per the wireframe's
 * own "opens New message / Create space" note. Since Sprint 10 that is not a
 * sheet any more: the list fades and slides away and the two options appear
 * as `surface` buttons under the search bar (see `composeOpen`).
 */
export default function Messaging() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const { conversations, loading, error, reload } = useConversations();
  const { spaces, loading: spacesLoading, error: spacesError, reload: reloadSpaces } = useSpaces();
  const [query, setQuery] = useState('');
  // Sprint 10: the compose button no longer opens a sheet: the list slides away
  // and the two options (New message / Create space) appear under the search
  // bar, which stays with the back arrow and the compose button.
  const [composeOpen, setComposeOpen] = useState(false);
  const composeProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(composeProgress, {
      toValue: composeOpen ? 1 : 0,
      duration: COMPOSE_ANIMATION_MS,
      useNativeDriver: true,
    }).start();
  }, [composeOpen, composeProgress]);
  // Android's back closes the options first, like the back arrow.
  useEffect(() => {
    if (!composeOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setComposeOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [composeOpen]);
  const openComposeOption = (route: '/messaging/new' | '/messaging/spaces/create') => {
    setComposeOpen(false);
    router.push(route);
  };
  const [joiningSpaceId, setJoiningSpaceId] = useState<string | null>(null);

  // Onboarding coach mark — points at the compose (airplane) button, shown
  // once ever per device (utils/composeCoachMark.ts), same shape as Stages
  // 2-5's coach marks.
  const [showComposeCoachMark, setShowComposeCoachMark] = useState(false);
  useEffect(() => {
    if (FORCE_SHOW_ONBOARDING_PREVIEWS) {
      setShowComposeCoachMark(true);
      return;
    }
    hasSeenComposeCoachMark().then((seen) => {
      if (!seen) setShowComposeCoachMark(true);
    });
  }, []);
  const dismissComposeCoachMark = useCallback(() => {
    setShowComposeCoachMark(false);
    markComposeCoachMarkSeen();
  }, []);

  // "Spaces" is for exploring ones you haven't joined — a space you're
  // already a member/owner of moves down into "Messages" instead (see
  // `joinedSpaces`/`messagingRows` below).
  const exploreSpaces = useMemo(() => spaces.filter((space) => !space.isMember), [spaces]);
  const joinedSpaces = useMemo(() => spaces.filter((space) => space.isMember), [spaces]);
  const { previews: spaceThreadPreviews, loading: spaceThreadsLoading } = useSpaceThreadPreviews(joinedSpaces);

  // Real, reported bug: the search bar up top sits above BOTH the "Spaces"
  // (explore) section and "Messages" below, but used to only filter
  // Messages — typing a query left the Spaces cards exactly as they were,
  // so the same search looked like it "worked" for one section and did
  // nothing for the other. Filtering both consistently, same pattern as
  // filteredConversations/filteredSpaceThreadPreviews below.
  const filteredExploreSpaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exploreSpaces;
    return exploreSpaces.filter((space) => space.name.toLowerCase().includes(q));
  }, [exploreSpaces, query]);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const { username, displayName } = c.otherParticipant;
      return username.toLowerCase().includes(q) || (displayName ?? '').toLowerCase().includes(q);
    });
  }, [conversations, query]);

  const filteredSpaceThreadPreviews = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return spaceThreadPreviews;
    return spaceThreadPreviews.filter((p) => p.space.name.toLowerCase().includes(q));
  }, [spaceThreadPreviews, query]);

  // Merged, sorted by whichever (conversation or space thread) had the most
  // recent activity — a joined space with no messages yet sorts by its own
  // `createdAt`, same fallback `ConversationSummaryContract` already uses
  // for a DM with no messages yet.
  const messagingRows = useMemo<MessagingRow[]>(() => {
    const conversationRows: MessagingRow[] = filteredConversations.map((conversation) => ({
      kind: 'conversation',
      key: `conversation:${conversation.id}`,
      timestamp: new Date(conversation.lastMessage?.sentAt ?? conversation.createdAt).getTime(),
      conversation,
    }));
    const spaceRows: MessagingRow[] = filteredSpaceThreadPreviews.map((preview) => ({
      kind: 'space',
      key: `space:${preview.space.id}`,
      timestamp: new Date(preview.lastMessage?.sentAt ?? preview.space.createdAt).getTime(),
      preview,
    }));
    return [...conversationRows, ...spaceRows].sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredConversations, filteredSpaceThreadPreviews]);

  // reload()/reloadSpaces() both flip their own `loading` flag true, which
  // also briefly swaps the list to its skeleton (same as this screen already
  // does on every tab re-focus, via useConversations/useSpaces' own
  // useFocusEffect) — accepted here as consistent with that existing
  // behavior, rather than adding a silent-reload mode purely for this.
  const { refreshing, onRefresh } = usePullToRefresh(
    useCallback(() => Promise.all([reload(), reloadSpaces()]), [reload, reloadSpaces]),
  );

  const messagesLoading = loading || (joinedSpaces.length > 0 && spaceThreadsLoading);
  // One shared flag for BOTH sections — real, reported "loads by parts"
  // complaint: Spaces and Messages resolve from independent fetches, so
  // gating each section on its own loading flag let one flip to real
  // content while the other was still showing its skeleton, a staggered
  // reveal. Neither section shows real content until EVERYTHING has
  // loaded; they flip together.
  const initialLoading = spacesLoading || messagesLoading;
  const spacesPreview = filteredExploreSpaces.slice(0, SPACES_PREVIEW_COUNT);

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
    // The paper light, from the bottom (the tabs' own edge) — explicit request.
    <ScreenBackground variant="default" gradientBackground gradientEdge="bottom">
      <Row align="center" gap="sm" style={styles.header}>
        <BackButton style={styles.backButton} onPress={composeOpen ? () => setComposeOpen(false) : undefined} />
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={t('chats.searchPlaceholder')} />
        </View>
        <IconButton
          name="paper-plane-outline"
          size={48}
          iconSize={22}
          iconColor={colors.ink}
          style={styles.composeButton}
          onPress={() => setComposeOpen((open) => !open)}
          accessibilityLabel={t('chats.composeA11y')}
          accessibilityState={{ expanded: composeOpen }}
          testID="chats-compose-button"
        />
      </Row>

      {showComposeCoachMark && (
        <View style={styles.composeCoachMarkWrap}>
          <CoachMark message={t('chats.composeCoachMark')} onDismiss={dismissComposeCoachMark} arrowPlacement="none" />
        </View>
      )}

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: composeProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [
                { translateY: composeProgress.interpolate({ inputRange: [0, 1], outputRange: [0, COMPOSE_SLIDE] }) },
              ],
            },
          ]}
          pointerEvents={composeOpen ? 'none' : 'auto'}
          accessibilityElementsHidden={composeOpen}
          importantForAccessibility={composeOpen ? 'no-hide-descendants' : 'auto'}
          testID="chats-content"
        >
          <FlatList
            data={initialLoading || error ? [] : messagingRows}
            keyExtractor={(row) => row.key}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <>
                <Row align="center" gap="xs" style={styles.sectionHeader}>
                  <Text variant="subheader">{t('chats.spacesTitle')}</Text>
                </Row>
                {initialLoading ? (
                  <View style={styles.spacesPreviewList}>
                    {Array.from({ length: SPACES_PREVIEW_COUNT }, (_, index) => (
                      <SpaceCardSkeleton key={index} />
                    ))}
                  </View>
                ) : spacesError ? (
                  <View style={styles.spacesEmptyCard}>
                    <Text variant="body" tone="secondary" align="center">
                      {t('spaces.loadError')}
                    </Text>
                  </View>
                ) : exploreSpaces.length === 0 ? (
                  <View style={styles.spacesEmptyCard}>
                    <Icon name="layers-outline" size={28} color={withAlpha(colors.paper, textOpacity.tertiary)} />
                    <Text variant="body" tone="secondary" align="center">
                      {t('chats.spacesEmptyState')}
                    </Text>
                  </View>
                ) : filteredExploreSpaces.length === 0 ? (
                  <View style={styles.spacesEmptyCard}>
                    <Text variant="body" tone="secondary" align="center">
                      {t('spaces.noResultsForSearch')}
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
                    {filteredExploreSpaces.length > SPACES_PREVIEW_COUNT && (
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
              </>
            }
            renderItem={({ item: row }) =>
              row.kind === 'conversation' ? (
                <ConversationListItem
                  conversation={row.conversation}
                  currentUserId={userId}
                  onPress={() =>
                    router.push({
                      pathname: '/messaging/[conversationId]',
                      params: {
                        conversationId: row.conversation.id,
                        otherUserId: row.conversation.otherParticipant.id,
                        otherUsername: row.conversation.otherParticipant.username,
                        otherDisplayName: row.conversation.otherParticipant.displayName ?? '',
                        otherProfileImageUrl: row.conversation.otherParticipant.profileImageUrl ?? '',
                        isPending: row.conversation.isPending ? '1' : '',
                      },
                    })
                  }
                />
              ) : (
                <SpaceThreadListItem
                  space={row.preview.space}
                  lastMessage={row.preview.lastMessage}
                  lastViewedAt={row.preview.lastViewedAt}
                  currentUserId={userId}
                  onPress={() => router.push(`/messaging/spaces/${row.preview.space.id}`)}
                />
              )
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ItemSeparatorComponent={() => <Divider marginVertical="xs" />}
            ListEmptyComponent={
              initialLoading ? (
                <View>
                  {Array.from({ length: 4 }, (_, index) => (
                    <MessageRowSkeleton key={index} />
                  ))}
                </View>
              ) : error ? (
                <View style={styles.center}>
                  <Text tone="secondary">{t('chats.loadError')}</Text>
                  <Button variant="outline" size="sm" onPress={reload}>
                    {t('common.actions.continue')}
                  </Button>
                </View>
              ) : query.trim() ? (
                <View style={styles.center}>
                  <Text tone="secondary">{t('chats.noResultsForSearch')}</Text>
                </View>
              ) : (
                <EmptyState
                  icon="chatbubbles-outline"
                  title={t('chats.emptyState')}
                  message={t('chats.emptyStateHint')}
                  actions={[
                    {
                      label: t('chats.emptyStateNew'),
                      onPress: () => router.push('/messaging/new'),
                      testID: 'empty-chats-new',
                    },
                    {
                      label: t('chats.emptyStateFindPeople'),
                      onPress: () => router.push('/(tabs)/search'),
                      testID: 'empty-chats-people',
                    },
                  ]}
                />
              )
            }
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.composeOptions,
            {
              opacity: composeProgress,
              transform: [
                {
                  translateY: composeProgress.interpolate({ inputRange: [0, 1], outputRange: [-COMPOSE_SLIDE / 2, 0] }),
                },
              ],
            },
          ]}
          pointerEvents={composeOpen ? 'auto' : 'none'}
          accessibilityElementsHidden={!composeOpen}
          importantForAccessibility={composeOpen ? 'auto' : 'no-hide-descendants'}
          testID="chats-compose-options"
        >
          <Pressable
            style={({ pressed }) => [styles.composeOption, pressed && styles.composeOptionPressed]}
            onPress={() => openComposeOption('/messaging/new')}
            accessibilityRole="button"
            testID="chats-compose-new-message"
          >
            <Icon name="chatbubble-outline" size={20} color={colors.paper} />
            <Text variant="body" weight="bold" style={styles.composeOptionLabel}>
              {t('chats.newMessageTitle')}
            </Text>
            <Icon name="chevron-forward-outline" size={18} color={withAlpha(colors.paper, textOpacity.secondary)} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.composeOption, pressed && styles.composeOptionPressed]}
            onPress={() => openComposeOption('/messaging/spaces/create')}
            accessibilityRole="button"
            testID="chats-compose-new-space"
          >
            <Icon name="add-circle-outline" size={20} color={colors.paper} />
            <Text variant="body" weight="bold" style={styles.composeOptionLabel}>
              {t('spaces.createCta')}
            </Text>
            <Icon name="chevron-forward-outline" size={18} color={withAlpha(colors.paper, textOpacity.secondary)} />
          </Pressable>
        </Animated.View>
      </View>
    </ScreenBackground>
  );
}

const COMPOSE_ANIMATION_MS = 220;
// How far the list slides down as it fades out (the options come in from half that above).
const COMPOSE_SLIDE = 24;

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
  composeCoachMarkWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  // No horizontal padding of their own anymore — this whole section now
  // renders inside the Messages FlatList's own ListHeaderComponent (so the
  // full screen scrolls as one unit), which already applies
  // `paddingHorizontal: spacing.lg` via `list` below. Real, reported bug
  // from that move: these previously sat OUTSIDE the FlatList and needed
  // their own inset, so keeping it here on top of the FlatList's own
  // doubled it.
  sectionHeader: {
    paddingBottom: spacing.md,
  },
  spacesEmptyCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  spacesPreviewList: {
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
  content: {
    flex: 1,
  },
  // Over the top of the content area, right under the search bar.
  composeOptions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // A bit of air under the search bar, on top of the header's own padding.
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  composeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.base,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  composeOptionPressed: {
    opacity: 0.8,
  },
  composeOptionLabel: {
    flex: 1,
  },
});
