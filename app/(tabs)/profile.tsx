import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors, spacing } from '../../constants/theme';
import { Text } from '../../components/ui/text';
import { IconButton } from '../../components/ui/iconButton';
import { getMyProfile } from '../../services/user/user.service';
import type { MyProfileContract } from '../../types/user';
import { ProfileHeader, PostsViewToggle, PostsGrid, ProfileContentSkeleton } from '../../components/profile';
import { openPostViewer } from '../../utils/postViewer';
import type { PostsView } from '../../components/profile';
import type { ChallengePhoto } from '../../types/challenge';
import { Row } from '../../components/layout/row';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

/**
 * Profile tab. Structured so future sections (followers, stats) can slot in
 * between the header and the posts grid without another reshuffle. Reloads
 * on focus so edits made in /profile/edit show up immediately.
 */
export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { username: sessionUsername, userId: sessionUserId } = useAuth();
  const isAdmin = useIsAdmin();
  const [profile, setProfile] = useState<MyProfileContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Default to "all" so your own profile isn't a surprise empty state the
  // moment most of your history happens to be private (rest-day check-ins
  // and any log without an explicit visibility default to private
  // server-side). "Public" stays one tap away via the eye toggle.
  const [view, setView] = useState<PostsView>('photos');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMyProfile()
        .then((data) => {
          if (!active) return;
          setProfile(data);
          setError(null);
        })
        .catch(() => {
          if (active) setError(t('profileEdit.loadError'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [t]),
  );

  // PostsGrid fetches its own photos internally (see components/profile/PostsGrid.tsx)
  // — bumping this signal is the only way this screen's pull-to-refresh can
  // also force it to refetch, alongside this screen's own profile data.
  const [postsRefreshSignal, setPostsRefreshSignal] = useState(0);
  const refreshProfile = useCallback(async () => {
    await Promise.allSettled([getMyProfile().then(setProfile)]);
    setPostsRefreshSignal((n) => n + 1);
  }, []);
  const { refreshing, onRefresh } = usePullToRefresh(refreshProfile);

  // Tapping a photo opens your posts as a feed (react, comment, share, and
  // delete from each post's "..." menu — B4). PostsGrid refetches on focus,
  // so a post deleted there is gone when you come back.
  const handlePhotoPress = useCallback(
    (photo: ChallengePhoto, photos: ChallengePhoto[]) => openPostViewer(photos, photo, { ownerId: sessionUserId }),
    [sessionUserId],
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
      <IconButton
        name="pencil-outline"
        iconSize={22}
        onPress={() => router.push('/profile/edit')}
        accessibilityRole="button"
        accessibilityLabel={t('profile.editButtonA11y')}
        hitSlop={10}
      />
    </Row>
  );

  return (
    <ScreenBackground variant="default" gradientBackground>
      {topBar}
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <ProfileContentSkeleton />
        ) : error ? (
          <View style={styles.center}>
            <Text tone="secondary">{error}</Text>
          </View>
        ) : (
          <>
            <ProfileHeader
              displayName={displayName}
              username={username}
              bio={profile?.bio}
              imageUrl={profile?.profile_image_url}
              streakDays={profile?.streak_days}
              followersCount={profile?.followers_count ?? 0}
              followingCount={profile?.following_count ?? 0}
              onPressFollowers={() => router.push('/profile/followers')}
              onPressFollowing={() => router.push('/profile/following')}
              practices={profile?.practice_preferences}
            />
            <PostsViewToggle view={view} onViewChange={setView} />
            <PostsGrid view={view} onPhotoPress={handlePhotoPress} refreshSignal={postsRefreshSignal} />
            <Pressable onPress={() => router.push('/profile/about')} style={styles.aboutLink}>
              <Text variant="caption" tone="secondary">{t('about.title')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
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
    gap: spacing.lg,
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
