import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { ConfirmationPopup } from '../../components/ui/confirmationPopup';
import { colors, spacing } from '../../constants/theme';
import { banUser, getPublicProfile } from '../../services/user/user.service';
import type { PublicProfileContract } from '../../types/user';
import { ProfileHeader, FollowButton, UserPostsGrid, ProfilePhotoModal } from '../../components/profile';
import type { ChallengePhoto } from '../../types/challenge';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

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
  const isAdmin = useIsAdmin();

  const [profile, setProfile] = useState<PublicProfileContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ChallengePhoto | null>(null);
  const [banPopupVisible, setBanPopupVisible] = useState(false);
  const [banning, setBanning] = useState(false);

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

  // UserPostsGrid fetches its own photos internally — bumping this signal is
  // the only way this screen's pull-to-refresh can also force it to refetch,
  // alongside this screen's own profile data.
  const [postsRefreshSignal, setPostsRefreshSignal] = useState(0);
  const refreshUserProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getPublicProfile(userId);
      setProfile(data);
      setError(false);
    } catch {
      setError(true);
    }
    setPostsRefreshSignal((n) => n + 1);
  }, [userId]);
  const { refreshing, onRefresh } = usePullToRefresh(refreshUserProfile);

  async function handleBan() {
    if (!userId) return;
    setBanning(true);
    try {
      await banUser(userId);
      setBanPopupVisible(false);
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setBanning(false);
    }
  }

  if (isOwnProfile) {
    return null;
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
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
                  {isAdmin && (
                    <Pressable
                      onPress={() => setBanPopupVisible(true)}
                      style={styles.banButton}
                      accessibilityRole="button"
                      accessibilityLabel={t('profile.banUserA11y')}
                    >
                      <Icon name="ban-outline" size={16} color={colors.error} />
                      <Text variant="label" weight="bold" style={styles.banButtonText}>
                        {t('profile.banUserButton')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              }
            />
            <UserPostsGrid userId={profile.id} onPhotoPress={setSelectedPhoto} refreshSignal={postsRefreshSignal} />
          </>
        )}
      </ScrollView>
      <ProfilePhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      <ConfirmationPopup
        visible={banPopupVisible}
        title={t('profile.banUserTitle')}
        description={t('profile.banUserDescription')}
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
          disabled: banning,
        }}
      />
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
    gap: spacing.sm,
  },
  banButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  banButtonText: {
    color: colors.error,
  },
});
