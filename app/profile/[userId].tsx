import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { ConfirmationPopup } from '../../components/ui/confirmationPopup';
import { colors, spacing } from '../../constants/theme';
import { banUser, getPublicProfile } from '../../services/user/user.service';
import type { PublicProfileContract } from '../../types/user';
import { ProfileHeader, FollowButton, PhotoGridList } from '../../components/profile';
import { openPostViewer } from '../../utils/postViewer';
import type { ChallengePhoto } from '../../types/challenge';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { getUserPosts } from '../../services/challenge/challenge.service';
import { IconButton } from '../../components/ui/iconButton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useUserPosts } from '../../hooks/useUserPosts';
import { queryKeys, staleTimes } from '../../services/cache/queries';
import { invalidateQueries, setQueryData } from '../../services/cache/queryCache';

const BAN_ICON_SIZE = 16;

/**
 * Another user's profile — GET /users/:userId/profile plus their visible
 * progress photos (GET /workout-posts/user/:userId, already
 * privacy-filtered server-side). Viewing your own id here just redirects to
 * the tab (same data, but the tab has the edit/settings entry points).
 */
// Every "view this other user" entry point in the app funnels through this
// one screen, so this is the single choke point to stop a malformed id
// before it ever reaches `GET /users/:id/profile` — that route's
// `ParseUUIDPipe` rejects anything that isn't UUID-shaped with a
// "Validation failed (uuid is expected)" error, which the app's global
// axios interceptor then surfaces as a toast regardless of this screen's
// own (silent) local error handling. Real, reported bug: whatever the
// exact upstream cause (a caller passing an empty/mangled id), this guard
// means it now degrades to the normal "user not found" state instead of a
// confusing validation toast.
// How far back to look for a post opened from a chat (20 posts per page).
const OPEN_POST_MAX_PAGES = 5;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function UserProfile() {
  const { userId: rawUserId, postId: rawPostId } = useLocalSearchParams<{ userId: string; postId?: string }>();
  const rawId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  // A post to open on arrival (a post shared in a chat — SharedPostCard).
  const postId = (Array.isArray(rawPostId) ? rawPostId[0] : rawPostId) || undefined;
  const userId = rawId && UUID_RE.test(rawId) ? rawId : undefined;
  const { t } = useTranslation();
  const router = useRouter();
  const { userId: sessionUserId } = useAuth();
  const isAdmin = useIsAdmin();
  const { showSuccess } = useErrorNotificationStore();

  const [banPopupVisible, setBanPopupVisible] = useState(false);
  const [banning, setBanning] = useState(false);

  const isOwnProfile = Boolean(sessionUserId && userId && sessionUserId === userId);
  // Your own profile normally swaps to the Profile TAB — but not when this
  // screen was opened to show one post (your own post shared in a chat):
  // `replace` dropped the chat from the history and the tab has no back
  // chevron, so you were stuck there. Real, reported bug.
  const redirectToOwnTab = isOwnProfile && !postId;
  const profileUserId = userId && !redirectToOwnTab ? userId : null;

  // Cached per user: going back and forth between a profile and its posts (or
  // opening the same person again) reuses what is loaded.
  const profileQuery = useCachedQuery(
    profileUserId ? queryKeys.publicProfile(profileUserId) : null,
    () => getPublicProfile(profileUserId!),
    { staleTime: staleTimes.social },
  );
  const profile = profileQuery.data;
  const posts = useUserPosts(profileUserId);

  const revalidateProfile = profileQuery.revalidate;
  const revalidatePosts = posts.revalidate;
  useFocusEffect(
    useCallback(() => {
      void revalidateProfile();
      void revalidatePosts();
    }, [revalidateProfile, revalidatePosts]),
  );

  useEffect(() => {
    if (redirectToOwnTab) {
      router.replace('/(tabs)/profile');
    }
  }, [redirectToOwnTab, router]);

  // Opened for one post (shared in a chat): find it in the author's posts
  // (newest first, a few pages at most) and open the post viewer on it, with
  // the posts loaded so far to scroll through. If it isn't visible to the
  // viewer any more, the profile simply shows.
  useEffect(() => {
    if (!userId || !postId) return;
    let active = true;
    (async () => {
      let cursor: string | undefined;
      const loaded: ChallengePhoto[] = [];
      for (let page = 0; page < OPEN_POST_MAX_PAGES && active; page++) {
        const { photos, nextCursor } = await getUserPosts(userId, cursor);
        loaded.push(...photos);
        const match = photos.find((photo) => String(photo.id) === postId);
        if (match) {
          if (active) openPostViewer(loaded, match, { ownerId: isOwnProfile ? sessionUserId : null });
          return;
        }
        if (!nextCursor) return;
        cursor = nextCursor;
      }
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, [userId, postId, isOwnProfile, sessionUserId]);

  const refetchProfile = profileQuery.refetch;
  const refetchPosts = posts.refetch;
  const refreshUserProfile = useCallback(async () => {
    if (!profileUserId) return;
    invalidateQueries(queryKeys.userBadges(profileUserId));
    await Promise.all([refetchProfile(), refetchPosts()]);
  }, [profileUserId, refetchProfile, refetchPosts]);
  const { refreshing, onRefresh } = usePullToRefresh(refreshUserProfile);

  // Confirmed follow/unfollow: the counter moves at once in the cached profile
  // (the follow hook then invalidates it, so the server's numbers follow).
  const handleFollowChange = useCallback(
    (isFollowing: boolean) => {
      if (!profileUserId) return;
      setQueryData<PublicProfileContract>(queryKeys.publicProfile(profileUserId), (previous) =>
        previous
          ? {
              ...previous,
              is_following: isFollowing,
              followers_count: Math.max(0, previous.followers_count + (isFollowing ? 1 : -1)),
            }
          : previous,
      );
    },
    [profileUserId],
  );

  const photos = posts.photos;
  const handlePhotoPress = useCallback(
    (photo: ChallengePhoto) =>
      openPostViewer(photos ?? [], photo, { ownerId: isOwnProfile ? sessionUserId : null }),
    [photos, isOwnProfile, sessionUserId],
  );

  async function handleBan() {
    if (!userId) return;
    setBanning(true);
    try {
      await banUser(userId);
      setBanPopupVisible(false);
      showSuccess({ message: t('profile.banUserSuccess') });
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setBanning(false);
    }
  }

  if (redirectToOwnTab) {
    return null;
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        {/* Sprint 10: badges behind the same ribbon icon as your own profile,
            on their own screen, instead of a row under the header. */}
        {profile && (
          <IconButton
            name="ribbon-outline"
            iconSize={22}
            onPress={() => router.push({ pathname: '/profile/badges', params: { userId: profile.id } })}
            accessibilityRole="button"
            accessibilityLabel={t('badges.openA11y')}
            hitSlop={10}
            testID="open-user-badges"
          />
        )}
      </View>
      {profileQuery.isLoading || !profile ? (
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View style={styles.center}>
            {profileQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text tone="secondary">{t('profile.userNotFound')}</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <PhotoGridList
          photos={photos ?? []}
          loading={posts.isLoading}
          emptyLabel={t('profile.emptyUserPhotos')}
          onPhotoPress={handlePhotoPress}
          hasMore={posts.hasMore}
          loadingMore={posts.loadingMore}
          onLoadMore={posts.loadMore}
          loadMoreLabel={t('profile.loadMorePosts')}
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          header={
            <>
              <ProfileHeader
                displayName={profile.display_name}
                username={profile.username}
                bio={profile.bio}
                imageUrl={profile.profile_image_url}
                streakDays={profile.streak_days}
                followersCount={profile.followers_count}
                followingCount={profile.following_count}
                practices={profile.practice_preferences}
                actions={
                  isOwnProfile ? null : (
                  <View style={styles.actionsWrap}>
                    <View style={styles.primaryActions}>
                    <FollowButton
                      userId={profile.id}
                      initialIsFollowing={profile.is_following}
                      onChange={handleFollowChange}
                    />
                    {/* Straight to a chat with this person (same entry as "Message the author" on a
                        post); /messaging/new resolves or creates the 1:1 conversation and opens it. */}
                    <Button
                      variant="outline"
                      size="md"
                      leftIcon={<Icon name="chatbubble-outline" size={16} color={colors.paper} />}
                      onPress={() => router.push({ pathname: '/messaging/new', params: { recipientUserId: profile.id } })}
                      accessibilityLabel={t('profile.messageButtonA11y')}
                      testID="profile-message-button"
                    >
                      {t('profile.messageButton')}
                    </Button>
                    </View>
                    {/* An admin-only action, kept quiet: the app's soft destructive button
                        (a translucent `error` fill and rim), not a bare red link. */}
                    {isAdmin && (
                      <Button
                        variant="dangerSubtle"
                        size="sm"
                        leftIcon={<Icon name="ban-outline" size={BAN_ICON_SIZE} color={colors.error} />}
                        onPress={() => setBanPopupVisible(true)}
                        accessibilityLabel={t('profile.banUserA11y')}
                      >
                        {t('profile.banUserButton')}
                      </Button>
                    )}
                  </View>
                  )
                }
              />
            </>
          }
        />
      )}
      <ConfirmationPopup
        visible={banPopupVisible}
        title={t('profile.banUserTitle')}
        description={t('profile.banUserDescription')}
        icon="ban-outline"
        iconColor={colors.error}
        onDismiss={() => !banning && setBanPopupVisible(false)}
        primaryButton={{
          label: t('profile.banUserConfirm'),
          onPress: handleBan,
          variant: 'danger',
          loading: banning,
        }}
        secondaryButton={{
          label: t('profile.banUserCancel'),
          onPress: () => setBanPopupVisible(false),
          variant: 'neutral',
          disabled: banning,
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  // Back on the left, the badges icon on the right.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  primaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionsWrap: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});
