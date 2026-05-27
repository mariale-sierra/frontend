import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors, spacing } from '../../constants/theme';
import { Text } from '../../components/ui/text';
import { getMe } from '../../services/user/user.service';
import type { UserProfileContract } from '../../types/user';
import { useAuth } from '../../hooks/useAuth';
import { ProfileHeader, PostsViewToggle, PostsGrid, ProfilePhotoModal } from '../../components/profile';
import type { PostsView } from '../../components/profile';
import type { ChallengePhoto } from '../../types/challenge';

export default function Profile() {
  const { username: sessionUsername } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfileContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<PostsView>('posts');
  const [selectedPhoto, setSelectedPhoto] = useState<ChallengePhoto | null>(null);

  useEffect(() => {
    getMe()
      .then(setProfile)
      .catch(() => setError('Could not load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const displayName = profile?.username ?? sessionUsername ?? 'User name';
  const username = profile?.username ?? sessionUsername ?? 'username';

  return (
    <ScreenBackground variant="default">
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
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
            <ProfileHeader displayName={displayName} username={username} />
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
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  center: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
