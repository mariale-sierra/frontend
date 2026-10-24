import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors, spacing } from '../../constants/theme';
import { Text } from '../../components/ui/text';
import { IconButton } from '../../components/ui/iconButton';
import { getMyProfile } from '../../services/user/user.service';
import { ProfileHeader, PostsViewToggle, PhotoGridList, ProfileContentSkeleton } from '../../components/profile';
import { openPostViewer } from '../../utils/postViewer';
import type { PostsView } from '../../components/profile';
import type { ChallengePhoto } from '../../types/challenge';
import { Row } from '../../components/layout/row';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useUserPosts } from '../../hooks/useUserPosts';
import { queryKeys, staleTimes } from '../../services/cache/queries';
import { invalidateQueries } from '../../services/cache/queryCache';

/**
 * Profile tab: one virtualized list (header, badges, toggle, then the photo
 * grid), so a long history only mounts the rows on screen and the next page
 * loads while scrolling. Data comes from the shared cache — an edit in
 * /profile/edit or a new log updates it without a full reload here.
 */
export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { username: sessionUsername, userId: sessionUserId } = useAuth();
  const isAdmin = useIsAdmin();
  // Default to "all" so your own profile isn't a surprise empty state the
  // moment most of your history happens to be private (rest-day check-ins
  // and any log without an explicit visibility default to private
  // server-side). "Public" stays one tap away via the eye toggle.
  const [view, setView] = useState<PostsView>('photos');

  // Cached (and kept on disk): opening the tab again shows the last profile at
  // once; an edit in /profile/edit writes its answer straight into this entry.
  const profileQuery = useCachedQuery(queryKeys.myProfile, getMyProfile, {
    staleTime: staleTimes.catalog,
    persist: true,
  });
  const profile = profileQuery.data;
  // Own posts come a page at a time (GET /workout-posts/user/:me): the unpaginated
  // /workout-posts/mine returns and enriches the whole history, which is what made this slow.
  const posts = useUserPosts(sessionUserId);

  const revalidateProfile = profileQuery.revalidate;
  const revalidatePosts = posts.revalidate;
  useFocusEffect(
    useCallback(() => {
      void revalidateProfile();
      void revalidatePosts();
    }, [revalidateProfile, revalidatePosts]),
  );

  const refetchProfile = profileQuery.refetch;
  const refetchPosts = posts.refetch;
  const refreshProfile = useCallback(async () => {
    invalidateQueries(queryKeys.myBadges);
    await Promise.all([refetchProfile(), refetchPosts()]);
  }, [refetchProfile, refetchPosts]);
  const { refreshing, onRefresh } = usePullToRefresh(refreshProfile);

  // 'posts' = only photos visible to followers; 'photos' = everything,
  // including private ones (only the owner ever sees this screen).
  const allPhotos = posts.photos;
  const visiblePhotos = useMemo(
    () => (view === 'posts' ? (allPhotos ?? []).filter((photo) => photo.visibility === 'public') : allPhotos ?? []),
    [allPhotos, view],
  );

  // Tapping a photo opens your posts as a feed (react, comment, share, and
  // delete from each post's "..." menu — B4); a deletion there drops it from
  // this cached grid too.
  const handlePhotoPress = useCallback(
    (photo: ChallengePhoto) => openPostViewer(visiblePhotos, photo, { ownerId: sessionUserId }),
    [sessionUserId, visiblePhotos],
  );

  const displayName = profile?.display_name ?? sessionUsername ?? 'User name';
  const username = profile?.username ?? sessionUsername ?? 'username';

  const topBar = (
    <Row justify="flex-end" gap="sm" style={styles.topBar}>
      {isAdmin && (
        <IconButton
          name="shield-checkmark-outline"
          iconSize={22}
          onPress={() => router.push('/profile/moderation')}
          accessibilityRole="button"
          accessibilityLabel={t('moderation.openA11y')}
          hitSlop={10}
          testID="open-moderation"
        />
      )}
      {/* Badges live on their own screen now (2026-10-23, explicit request: off
          the profile itself, behind an icon up here). */}
      <IconButton
        name="ribbon-outline"
        iconSize={22}
        onPress={() => router.push('/profile/badges')}
        accessibilityRole="button"
        accessibilityLabel={t('badges.openA11y')}
        hitSlop={10}
        testID="open-badges"
      />
      {/* Sprint 10, B2: a gear for Settings (log out, notifications, legal...).
          Neurolab participants looked for those behind the old pencil, which
          only opened Edit profile — that is now the button under the header. */}
      <IconButton
        name="settings-outline"
        iconSize={22}
        onPress={() => router.push('/profile/settings')}
        accessibilityRole="button"
        accessibilityLabel={t('settings.openA11y')}
        hitSlop={10}
        testID="open-settings"
      />
    </Row>
  );

  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />;

  if (profileQuery.isLoading || !profile) {
    return (
      <ScreenBackground variant="default" gradientBackground>
        {topBar}
        <ScrollView contentContainerStyle={styles.container} refreshControl={refreshControl}>
          {profileQuery.isLoading ? (
            <ProfileContentSkeleton />
          ) : (
            <View style={styles.center}>
              <Text tone="secondary">{t('profileEdit.loadError')}</Text>
            </View>
          )}
        </ScrollView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="default" gradientBackground>
      {topBar}
      <PhotoGridList
        photos={visiblePhotos}
        loading={posts.isLoading}
        emptyLabel={view === 'posts' ? t('profile.emptyPublicPhotos') : t('profile.emptyAllPhotos')}
        emptyTitle={t('profile.emptyPostsTitle')}
        emptyActions={[
          { label: t('profile.emptyPostsExplore'), onPress: () => router.push('/(tabs)/challenges?view=explore'), testID: 'empty-posts-explore' },
          { label: t('profile.emptyPostsLog'), onPress: () => router.push('/log'), testID: 'empty-posts-log' },
        ]}
        onPhotoPress={handlePhotoPress}
        hasMore={posts.hasMore}
        loadingMore={posts.loadingMore}
        onLoadMore={posts.loadMore}
        loadMoreLabel={t('profile.loadMorePosts')}
        refreshControl={refreshControl}
        contentContainerStyle={styles.container}
        header={
          <>
            <ProfileHeader
              displayName={displayName}
              username={username}
              bio={profile.bio}
              imageUrl={profile.profile_image_url}
              streakDays={profile.streak_days}
              followersCount={profile.followers_count ?? 0}
              followingCount={profile.following_count ?? 0}
              onPressFollowers={() => router.push('/profile/followers')}
              onPressFollowing={() => router.push('/profile/following')}
              practices={profile.practice_preferences}
            />
            {/* No Edit profile button (2026-10-23, explicit request): it's a row
                in Settings, behind the gear above. */}
            <PostsViewToggle view={view} onViewChange={setView} />
          </>
        }
        footer={
          <Pressable onPress={() => router.push('/profile/about')} style={styles.aboutLink}>
            <Text variant="caption" tone="secondary">{t('about.title')}</Text>
          </Pressable>
        }
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    // Matches the wireframe's consistent 16px (`base`) edge margin —
    // everything on this screen (icon row, avatar block, toggle, grid) sits
    // at that inset except the stats row, which adds its own extra padding
    // on top (see ProfileHeader's statsRow) to reach the wireframe's wider
    // 32px there specifically.
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },
  container: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  aboutLink: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
});
