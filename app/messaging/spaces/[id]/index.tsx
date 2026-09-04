import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '../../../../utils/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { BackButton } from '../../../../components/ui/backButton';
import { IconButton } from '../../../../components/ui/iconButton';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { ConfirmationPopup } from '../../../../components/ui/confirmationPopup';
import { Row } from '../../../../components/layout/row';
import { IconStack } from '../../../../components/layout/iconStack';
import { SpaceAvatar } from '../../../../components/spaces/SpaceAvatar';
import { SpaceMessageBubble } from '../../../../components/spaces/SpaceMessageBubble';
import { SpacePreviewSkeleton } from '../../../../components/spaces/SpacePreviewSkeleton';
import { UserAvatar } from '../../../../components/ui/userAvatar';
import { useSpace } from '../../../../hooks/useSpace';
import { useSpaceMessages } from '../../../../hooks/useSpaceMessages';
import { useSpaceMembers } from '../../../../hooks/useSpaceMembers';
import { useScrollToLatestMessage } from '../../../../hooks/useScrollToLatestMessage';
import { useAuth } from '../../../../hooks/useAuth';
import { joinSpace, leaveSpace } from '../../../../services/spaces/spaces.service';
import { getSpaceAccentColor, getSpaceMembershipCta } from '../../../../services/adapters/spaceAdapter';
import type { SpaceMembershipCta } from '../../../../services/adapters/spaceAdapter';
import { formatCount } from '../../../../utils/format';
import { getDaySeparator, isDifferentDay } from '../../../../utils/time';
import { markSpaceThreadViewed } from '../../../../utils/spaceThreadReads';
import { colors, radius, spacing } from '../../../../constants/theme';
import { withAlpha } from '../../../../utils/color';
import type { SpaceContract } from '../../../../types/space';

const MEMBER_STACK_MAX = 5;
// Bumped up two sizes from 32, per explicit request — 44 isn't a new
// invented number, it's the same avatar size already used elsewhere in this
// app (e.g. HEADER_SIDE_SIZE's icon buttons, and this screen's own thread
// header avatar sits between 40/44 territory too).
const MEMBER_AVATAR_SIZE = 44;

const HEADER_SIDE_SIZE = 44;

/**
 * A space's main screen — one of two wireframes depending on the viewer's
 * relationship to it. Owner/member: Chats-47B, the actual group-chat thread
 * (see `SpaceThread` below). Not a member yet: Chats-49A/49B, a read-only
 * preview with a Join/Request/Pending CTA (see `SpacePreview` below) — they
 * can't chat until they're in.
 */
export default function SpaceScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const spaceId = typeof id === 'string' && id.length > 0 ? id : null;
  const { space, loading, error, reload } = useSpace(spaceId);
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);

  async function handleJoin() {
    if (!spaceId) return;
    setActionLoading(true);
    try {
      await joinSpace(spaceId);
      reload();
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    if (!spaceId) return;
    setActionLoading(true);
    try {
      await leaveSpace(spaceId);
      setLeaveConfirmVisible(false);
      safeBack('/(tabs)');
    } catch {
      setActionLoading(false);
    }
  }

  const accentColor = space ? getSpaceAccentColor(space) : colors.primary;
  const cta = space ? getSpaceMembershipCta(space) : null;
  const isMemberView = cta?.kind === 'owner' || cta?.kind === 'member';

  return (
    <ScreenBackground variant="default">
      {isMemberView && space ? (
        <SpaceThread
          space={space}
          accentColor={accentColor}
          isOwner={cta?.kind === 'owner'}
          onLeavePress={() => setLeaveConfirmVisible(true)}
        />
      ) : (
        <SpacePreview
          space={space}
          loading={loading}
          error={error}
          onRetry={reload}
          accentColor={accentColor}
          cta={cta}
          actionLoading={actionLoading}
          onJoinPress={handleJoin}
        />
      )}

      <ConfirmationPopup
        visible={leaveConfirmVisible}
        title={t('spaces.leaveConfirmTitle')}
        description={t('spaces.leaveConfirmMessage')}
        icon="log-out-outline"
        iconColor={colors.error}
        primaryButton={{
          label: t('spaces.leaveCta'),
          onPress: handleLeave,
          variant: 'danger',
          loading: actionLoading,
        }}
        secondaryButton={{
          label: t('spaces.cancelCta'),
          onPress: () => setLeaveConfirmVisible(false),
          variant: 'neutral',
          disabled: actionLoading,
        }}
        onDismiss={() => setLeaveConfirmVisible(false)}
      />
    </ScreenBackground>
  );
}

const PREVIEW_AVATAR_SIZE = 72;

interface SpacePreviewProps {
  space: SpaceContract | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  accentColor: string;
  cta: SpaceMembershipCta | null;
  actionLoading: boolean;
  onJoinPress: () => void;
}

/**
 * What a viewer sees when they tap a space they haven't joined yet —
 * wireframes Chats-49A (join/request) and 49B (request already pending).
 * Only ever reached for `cta.kind` 'join' | 'request' | 'pending' — an
 * owner/member lands in `SpaceThread` instead (see `isMemberView` above).
 */
function SpacePreview({
  space,
  loading,
  error,
  onRetry,
  accentColor,
  cta,
  actionLoading,
  onJoinPress,
}: SpacePreviewProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isPending = cta?.kind === 'pending';
  // Easy win, no backend change needed — GET /spaces/:id/members already
  // exists (used by the full Members list screen); this just asks for the
  // same data and shows the first few.
  const { members } = useSpaceMembers(space?.id ?? null);
  const memberStack = members.slice(0, MEMBER_STACK_MAX);
  const extraMemberCount = Math.max(0, members.length - memberStack.length);

  return (
    <>
      <View style={styles.previewHeader}>
        <BackButton style={styles.headerSideButton} />
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.previewBody}>
        {loading ? (
          <SpacePreviewSkeleton />
        ) : error || !space ? (
          <View style={styles.center}>
            <Text tone="secondary">{t('spaces.infoLoadError')}</Text>
            <Button variant="outline" size="sm" onPress={onRetry}>
              {t('common.actions.continue')}
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.previewHero}>
              <SpaceAvatar name={space.name} accentColor={accentColor} imageUrl={space.imageUrl} size={PREVIEW_AVATAR_SIZE} />
              {space.activityCategory && (
                <View style={[styles.previewBadge, { backgroundColor: accentColor }]}>
                  <Text variant="caption" weight="bold" style={styles.badgeText}>
                    {space.activityCategory.name}
                  </Text>
                </View>
              )}
              <Text variant="title" numberOfLines={1} align="center">
                {space.name}
              </Text>
              <Row gap="xs" align="center" justify="center">
                <Icon
                  name={space.visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                  size={14}
                  color={colors.paper}
                />
                <Text variant="caption" tone="secondary">
                  {t(
                    space.visibility === 'public'
                      ? 'spaces.previewVisibilityPublic'
                      : 'spaces.previewVisibilityPrivate',
                  )}
                  {' · '}
                  {t('spaces.membersCount', {
                    count: space.membersCount,
                    formattedCount: formatCount(space.membersCount),
                  })}
                </Text>
              </Row>
            </View>

            {memberStack.length > 0 && (
              <Row gap="sm" align="center" justify="center" style={styles.memberStackRow}>
                <IconStack max={MEMBER_STACK_MAX}>
                  {memberStack.map((member) => (
                    <View key={member.id} style={styles.memberAvatarRing}>
                      <UserAvatar
                        username={member.username}
                        imageUrl={member.profileImageUrl}
                        size={MEMBER_AVATAR_SIZE}
                      />
                    </View>
                  ))}
                </IconStack>
                {extraMemberCount > 0 && (
                  <Text variant="caption" tone="secondary">
                    {t('spaces.memberStackMore', { count: extraMemberCount })}
                  </Text>
                )}
              </Row>
            )}

            {space.description ? (
              <Text variant="body" tone="secondary" align="center" style={styles.previewDescription}>
                {space.description}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {!loading && !error && space && cta && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {isPending ? (
            <Button
              variant="subtle"
              size="md"
              disabled
              leftIcon={<Icon name="time-outline" size={20} color={colors.paper} />}
            >
              {t('spaces.requestPendingCta')}
            </Button>
          ) : (
            <Button
              size="md"
              loading={actionLoading}
              onPress={onJoinPress}
              leftIcon={<Icon name="person-add-outline" size={20} color={colors.ink} />}
              style={{ backgroundColor: accentColor }}
            >
              {cta.kind === 'request' ? t('spaces.requestCta') : t('spaces.joinCta')}
            </Button>
          )}
        </View>
      )}
    </>
  );
}

const HEADER_AVATAR_SIZE = 40;
const SEND_BUTTON_SIZE = 40;

interface SpaceThreadProps {
  space: SpaceContract;
  accentColor: string;
  isOwner: boolean;
  onLeavePress: () => void;
}

/**
 * The actual group-chat thread — wireframe Chats-47B. Owners get the
 * requests (private spaces only, same gating "Manage space" already uses
 * for its own Join requests row) and settings icons the wireframe shows;
 * a non-owner member instead gets a single "leave" icon — 47B's header has
 * no icon at all for that case, but this screen used to be the only place a
 * member could leave a space (its old "info" content, still shown to
 * non-members below), so that action is kept reachable rather than silently
 * dropped now that members land straight in the thread.
 */
function SpaceThread({ space, accentColor, isOwner, onLeavePress }: SpaceThreadProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const { messages, loading, error, sending, hasMore, loadingOlder, loadOlder, send, reload } =
    useSpaceMessages(space.id);
  const [draft, setDraft] = useState('');
  const { listRef, ready, onContentSizeChange, onLayout } = useScrollToLatestMessage(messages);

  // Space messages have no server-side read-tracking (see
  // utils/spaceThreadReads.ts) — opening the thread is this device's own
  // signal that its latest message has been seen, driving the Messages
  // list's unread dot for this space (SpaceThreadListItem).
  useEffect(() => {
    markSpaceThreadViewed(space.id);
  }, [space.id]);

  const handleSend = useCallback(async () => {
    if (!draft.trim()) return;
    const toSend = draft;
    setDraft('');
    await send(toSend);
  }, [draft, send]);

  return (
    <>
      <View style={styles.threadHeader}>
        <BackButton style={styles.headerSideButton} />
        <Row align="center" gap="sm" style={styles.threadHeaderInfo} justify="flex-start">
          <SpaceAvatar name={space.name} accentColor={accentColor} imageUrl={space.imageUrl} size={HEADER_AVATAR_SIZE} />
          <View style={styles.threadHeaderTextBlock}>
            <Text variant="body" weight="bold" numberOfLines={1}>
              {space.name}
            </Text>
            {space.activityCategory && (
              <Row gap="xs" align="center" justify="flex-start">
                <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
                <Text
                  variant="caption"
                  weight="bold"
                  numberOfLines={1}
                  style={[styles.categoryLabel, { color: accentColor }]}
                >
                  {t('spaces.categorySubtitle', { name: space.activityCategory.name })}
                </Text>
              </Row>
            )}
          </View>
        </Row>
        {isOwner && space.visibility === 'private' && (
          <IconButton
            name="person-add-outline"
            size={HEADER_SIDE_SIZE}
            iconColor={colors.paper}
            onPress={() => router.push(`/messaging/spaces/${space.id}/join-requests`)}
            accessibilityLabel={t('spaces.requestsA11y')}
          />
        )}
        {isOwner ? (
          <IconButton
            name="settings-outline"
            size={HEADER_SIDE_SIZE}
            iconColor={colors.paper}
            onPress={() => router.push(`/messaging/spaces/${space.id}/manage`)}
            accessibilityLabel={t('spaces.optionsA11y')}
          />
        ) : (
          <IconButton
            name="log-out-outline"
            size={HEADER_SIDE_SIZE}
            iconColor={colors.paper}
            onPress={onLeavePress}
            accessibilityLabel={t('spaces.leaveCta')}
          />
        )}
      </View>

      {loading ? (
        // Same reasoning as 1:1 chat's own thread loading state — a
        // message thread's real shape isn't predictable enough for a
        // skeleton to preview honestly, so this stays a spinner.
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('spaces.threadLoadError')}</Text>
          <Button variant="outline" size="sm" onPress={reload}>
            {t('common.actions.continue')}
          </Button>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            // Hidden until scrolled to the latest message — see
            // useScrollToLatestMessage's own doc comment.
            style={{ opacity: ready ? 1 : 0 }}
            onContentSizeChange={onContentSizeChange}
            onLayout={onLayout}
            renderItem={({ item, index }) => {
              const previous = messages[index - 1];
              const showDaySeparator = !previous || isDifferentDay(previous.sentAt, item.sentAt);
              const isMine = item.sender.id === userId;
              return (
                <>
                  {showDaySeparator && <DaySeparator iso={item.sentAt} t={t} />}
                  <SpaceMessageBubble message={item} isMine={isMine} />
                </>
              );
            }}
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
                <Text tone="secondary">{t('spaces.noMessagesYet')}</Text>
              </View>
            }
          />

          <View style={styles.inputBar}>
            <Row align="center" gap="sm" justify="flex-start">
              <View style={styles.inputWrapper}>
                <Input
                  containerStyle={styles.input}
                  style={styles.inputText}
                  placeholderVariant="caption"
                  placeholder={t('spaces.messagePlaceholder')}
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
                style={[
                  styles.sendButton,
                  { backgroundColor: accentColor },
                  (sending || !draft.trim()) && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={sending || !draft.trim()}
              />
            </Row>
          </View>
        </KeyboardAvoidingView>
      )}
    </>
  );
}

/** Same "TODAY"/"Yesterday" pill as 1:1 chat's own DaySeparator (Chats-47A);
 * a space's thread uses the identical treatment (Chats-47B). */
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerSideButton: {
    marginLeft: -spacing.sm,
  },
  headerSpacer: {
    width: HEADER_SIDE_SIZE,
  },
  badgeText: {
    color: colors.ink,
    opacity: 1,
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  // PREVIEW (Chats-49A/49B) — not-yet-a-member's join/request screen.
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  previewBody: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  previewHero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  previewBadge: {
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewDescription: {
    paddingHorizontal: spacing.sm,
  },
  memberStackRow: {
    marginTop: spacing.xs,
  },
  // A ring in the screen's own background color around each stacked
  // avatar, so overlapping circles (IconStack) read as distinct people
  // instead of blending into one blob.
  memberAvatarRing: {
    borderRadius: radius.big,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  // Same sticky-footer chrome reused across Spaces screens (SpaceForm's
  // create/manage footer, itself matching app/(add)/metrics.tsx's own
  // bottom bar) — surface background, hairline top border, safe-area-aware
  // bottom padding.
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  // THREAD (Chats-47B)
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  threadHeaderInfo: {
    flex: 1,
  },
  threadHeaderTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: radius.big,
  },
  // Custom `color` override on `Text` needs an explicit `opacity: 1` — the
  // component's tone-based opacity scale otherwise still applies underneath
  // it and mutes the accent color (see components/ui/text.tsx's own
  // documented warning; a real, previously-shipped bug elsewhere came from
  // skipping this).
  categoryLabel: {
    opacity: 1,
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
  inputBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  inputText: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.ink,
    borderRadius: radius.big,
    paddingVertical: spacing.sm,
  },
  sendButton: {
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
