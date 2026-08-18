import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { colors, spacing } from '../../constants/theme';
import { getPublicProfile } from '../../services/user/user.service';
import type { PublicProfileContract } from '../../types/user';
import { ProfileHeader, FollowButton, UserPostsGrid, ProfilePhotoModal } from '../../components/profile';
import type { ChallengePhoto } from '../../types/challenge';
import { useAuth } from '../../hooks/useAuth';

/**
 * Another user's profile — GET /users/:userId/profile plus their visible
 * progress photos (GET /workout-posts/user/:userId, already
 * privacy-filtered server-side). Viewing your own id here just redirects to
 * the tab (same data, but the tab has the edit/settings entry points).
 */
export default function UserProfile() {
  const { userId: rawUserId } = useLocalSearchParams<{ userId: string }>();
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const { t } = useTranslation();
  const router = useRouter();
  const { userId: sessionUserId } = useAuth();

  const [profile, setProfile] = useState<PublicProfileContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ChallengePhoto | null>(null);

  const isOwnProfile = Boolean(sessionUserId && userId && sessionUserId === userId);

  useFocusEffect(
    useCallback(() => {
      if (!userId || isOwnProfile) return;
      let active = true;
      setLoading(true);
      getPublicProfile(userId)
        .then((data) => {
          if (active) {
            setProfile(data);
            setError(false);
          }
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [userId, isOwnProfile]),
  );

  useEffect(() => {
    if (isOwnProfile) {
      router.replace('/(tabs)/profile');
    }
  }, [isOwnProfile, router]);

  if (isOwnProfile) {
    return null;
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error || !profile ? (
          <View style={styles.center}>
            <Text tone="secondary">{t('profile.userNotFound')}</Text>
          </View>
        ) : (
          <>
            <ProfileHeader
              displayName={profile.display_name}
              username={profile.username}
              bio={profile.bio}
              imageUrl={profile.profile_image_url}
              actions={
                <>
                  <View style={styles.countsRow}>
                    <Text variant="body">
                      <Text variant="body" style={styles.countNumber}>
                        {profile.followers_count}
                      </Text>{' '}
                      {t('profile.followersLabel')}
                    </Text>
                    <Text variant="body">
                      <Text variant="body" style={styles.countNumber}>
                        {profile.following_count}
                      </Text>{' '}
                      {t('profile.followingLabel')}
                    </Text>
                  </View>
                  <FollowButton
                    userId={profile.id}
                    initialIsFollowing={profile.is_following}
                    onChange={(isFollowing) =>
                      setProfile((prev) =>
                        prev
                          ? {
                              ...prev,
                              followers_count: prev.followers_count + (isFollowing ? 1 : -1),
                            }
                          : prev,
                      )
                    }
                  />
                </>
              }
            />
            <UserPostsGrid userId={profile.id} onPhotoPress={setSelectedPhoto} />
          </>
        )}
      </ScrollView>
      <ProfilePhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  center: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  countsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  countNumber: {
    fontWeight: '700',
  },
});
