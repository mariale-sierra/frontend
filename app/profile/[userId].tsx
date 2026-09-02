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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function UserProfile() {
  const { userId: rawUserId } = useLocalSearchParams<{ userId: string }>();
  const rawId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const userId = rawId && UUID_RE.test(rawId) ? rawId : undefined;
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
      if (!userId || isOwnProfile) {
        if (!userId) setLoading(false);
        return;
      }
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
              streakDays={profile.streak_days}
              followersCount={profile.followers_count}
              followingCount={profile.following_count}
              actions={
                <View style={styles.actionsWrap}>
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
                </View>
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
  actionsWrap: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
});
