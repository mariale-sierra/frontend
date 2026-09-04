import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors, spacing } from '../../constants/theme';
import { Text } from '../../components/ui/text';
import { IconButton } from '../../components/ui/iconButton';
import { getMyProfile } from '../../services/user/user.service';
import { getPendingInvites } from '../../services/invites/invite.service';
import type { MyProfileContract } from '../../types/user';
import { ProfileHeader, PostsViewToggle, PostsGrid, ProfilePhotoModal, ProfileContentSkeleton } from '../../components/profile';
import type { PostsView } from '../../components/profile';
import type { ChallengePhoto } from '../../types/challenge';
import { Row } from '../../components/layout/row';
import { useAuth } from '../../hooks/useAuth';

/**
 * Profile tab. Structured so future sections (followers, stats) can slot in
 * between the header and the posts grid without another reshuffle. Reloads
 * on focus so edits made in /profile/edit show up immediately.
 */
export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { username: sessionUsername } = useAuth();
  const [profile, setProfile] = useState<MyProfileContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Default to "all" so your own profile isn't a surprise empty state the
  // moment most of your history happens to be private (rest-day check-ins
  // and any log without an explicit visibility default to private
  // server-side). "Public" stays one tap away via the eye toggle.
  const [view, setView] = useState<PostsView>('photos');
  const [selectedPhoto, setSelectedPhoto] = useState<ChallengePhoto | null>(null);
  const [hasPendingInvites, setHasPendingInvites] = useState(false);

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

  // Drives the notification dot on the invitations icon — real pending-invite
  // data (already used by the invitations screen itself), not decorative.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPendingInvites()
        .then((invites) => {
          if (active) setHasPendingInvites(invites.length > 0);
        })
        .catch(() => {
          if (active) setHasPendingInvites(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const displayName = profile?.display_name ?? sessionUsername ?? 'User name';
  const username = profile?.username ?? sessionUsername ?? 'username';

  const topBar = (
    <Row justify="flex-end" gap="sm" style={styles.topBar}>
      <IconButton
        name="barbell-outline"
        iconSize={22}
        onPress={() => router.push('/exercises')}
        accessibilityRole="button"
        accessibilityLabel={t('profile.exercisesButtonA11y')}
        hitSlop={10}
      />
      <IconButton
        name="pencil-outline"
        iconSize={22}
        onPress={() => router.push('/profile/edit')}
        accessibilityRole="button"
        accessibilityLabel={t('profile.editButtonA11y')}
        hitSlop={10}
      />
      <View>
        <IconButton
          name="mail-outline"
          iconSize={22}
          onPress={() => router.push('/invitations')}
          accessibilityRole="button"
          accessibilityLabel={t('profile.invitationsButtonA11y')}
          hitSlop={10}
        />
        {hasPendingInvites && <View style={styles.notificationDot} />}
      </View>
    </Row>
  );

  return (
    <ScreenBackground variant="default">
      {topBar}
      <ScrollView contentContainerStyle={styles.container}>
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
            />
            <PostsViewToggle view={view} onViewChange={setView} />
            <PostsGrid view={view} onPhotoPress={setSelectedPhoto} />
            <Pressable onPress={() => router.push('/profile/about')} style={styles.aboutLink}>
              <Text variant="caption" tone="secondary">{t('about.title')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      <ProfilePhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
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
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.ink,
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
