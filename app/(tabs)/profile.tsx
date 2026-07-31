import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors, spacing } from '../../constants/theme';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { getMyProfile } from '../../services/user/user.service';
import type { MyProfileContract } from '../../types/user';
import { useAuth } from '../../hooks/useAuth';
import { ProfileHeader, PostsViewToggle, PostsGrid, ProfilePhotoModal } from '../../components/profile';
import type { PostsView } from '../../components/profile';
import type { ChallengePhoto } from '../../types/challenge';
import { Row } from '../../components/layout/row';

/**
 * Profile tab. Structured so future sections (followers, stats) can slot in
 * between the header and the posts grid without another reshuffle. Reloads
 * on focus so edits made in /profile/edit show up immediately.
 */
export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { username: sessionUsername, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<MyProfileContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<PostsView>('posts');
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

  function handleLogoutPress() {
    Alert.alert(
      t('profile.logoutConfirmTitle', { defaultValue: 'Cerrar sesión' }),
      t('profile.logoutConfirmMessage', { defaultValue: '¿Seguro que quieres cerrar sesión?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
        { text: t('profile.logoutButton', { defaultValue: 'Cerrar sesión' }), style: 'destructive', onPress: () => logout() },
      ],
    );
  }

  const logoutButton = (
    <Button
      variant="danger"
      size="sm"
      onPress={handleLogoutPress}
      style={styles.actionButton}
      accessibilityLabel={t('profile.logoutButtonA11y', { defaultValue: 'Cerrar sesión' })}
    >
      {t('profile.logoutButton', { defaultValue: 'Cerrar sesión' })}
    </Button>
  );

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
            <View style={styles.errorLogoutWrap}>{logoutButton}</View>
          </View>
        ) : (
          <>
            <ProfileHeader
              displayName={displayName}
              username={username}
              bio={profile?.bio}
              imageUrl={profile?.profile_image_url}
              actions={
                <Row gap="sm" justify="flex-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => router.push('/profile/edit')}
                    style={styles.actionButton}
                  >
                    {t('profileEdit.entry')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => router.push('/invitations')}
                    style={styles.actionButton}
                  >
                    {t('invites.screenTitle')}
                  </Button>
                  {logoutButton}
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
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  center: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorLogoutWrap: {
    minWidth: 160,
  },
  actionButton: {
    flex: 1,
  },
});
