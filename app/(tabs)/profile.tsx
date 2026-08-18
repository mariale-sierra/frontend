import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors, spacing } from '../../constants/theme';
import { Text } from '../../components/ui/text';
import { IconButton } from '../../components/ui/iconButton';
import { getMyProfile } from '../../services/user/user.service';
import type { MyProfileContract } from '../../types/user';
import { ProfileHeader, PostsViewToggle, PostsGrid, ProfilePhotoModal } from '../../components/profile';
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

  const displayName = profile?.display_name ?? sessionUsername ?? 'User name';
  const username = profile?.username ?? sessionUsername ?? 'username';

  const topBar = (
    <Row justify="flex-end" gap="md" style={styles.topBar}>
      <IconButton
        name="mail"
        iconSize={24}
        onPress={() => router.push('/invitations')}
        accessibilityRole="button"
        accessibilityLabel={t('profile.invitationsButtonA11y')}
        hitSlop={10}
      />
      <IconButton
        name="settings"
        iconSize={24}
        onPress={() => router.push('/profile/edit')}
        accessibilityRole="button"
        accessibilityLabel={t('profile.settingsButtonA11y')}
        hitSlop={10}
      />
    </Row>
  );

  return (
    <ScreenBackground variant="default">
      {topBar}
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
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
              actions={
                <Row gap="lg">
                  <Pressable
                    onPress={() => router.push('/profile/followers')}
                    accessibilityRole="button"
                  >
                    <Text variant="body">
                      <Text variant="body" style={styles.countNumber}>
                        {profile?.followers_count ?? 0}
                      </Text>{' '}
                      {t('profile.followersLabel')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/profile/following')}
                    accessibilityRole="button"
                  >
                    <Text variant="body">
                      <Text variant="body" style={styles.countNumber}>
                        {profile?.following_count ?? 0}
                      </Text>{' '}
                      {t('profile.followingLabel')}
                    </Text>
                  </Pressable>
                </Row>
              }
            />
            <PostsViewToggle view={view} onViewChange={setView} />
            <PostsGrid view={view} onPhotoPress={setSelectedPhoto} />
          </>
        )}
      </ScrollView>
      <ProfilePhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  countNumber: {
    fontWeight: '700',
  },
  center: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
