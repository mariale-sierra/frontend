import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/button';
import { SearchBar } from '../../../components/ui/searchBar';
import { UserAvatar } from '../../../components/ui/userAvatar';
import { Card } from '../../../components/ui/card';
import { ConfirmationPopup } from '../../../components/ui/confirmationPopup';
import { Row } from '../../../components/layout/row';
import { searchUsers } from '../../../services/user/user.service';
import { createInvite } from '../../../services/invites/invite.service';
import { getChallenge } from '../../../services/challenge/challenge.service';
import { useErrorNotificationStore } from '../../../store/errorNotificationStore';
import { colors, spacing } from '../../../constants/theme';
import type { PublicProfileContract } from '../../../types/user';

/**
 * Invite-users flow, reached from the challenge detail screen. Search by
 * username, confirm before sending, per-user sent state so the same user
 * can't be invited twice from this screen.
 */
export default function InviteUsers() {
  const { t } = useTranslation();
  const { id: challengeId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [challengeName, setChallengeName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicProfileContract[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [confirmUser, setConfirmUser] = useState<PublicProfileContract | null>(null);
  const { show, showSuccess } = useErrorNotificationStore();

  useEffect(() => {
    if (!challengeId) return;
    getChallenge(challengeId)
      .then((challenge) => setChallengeName(challenge?.name ?? ''))
      .catch(() => setChallengeName(''));
  }, [challengeId]);

  // Debounced username search against GET /users/search.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      searchUsers(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSendConfirmed = async () => {
    const user = confirmUser;
    setConfirmUser(null);
    if (!user || !challengeId || sendingId) return;

    setSendingId(user.id);
    try {
      await createInvite(challengeId, user.id);
      setSentIds((prev) => new Set(prev).add(user.id));
      showSuccess({ message: t('invites.successSent', { username: user.username }) });
    } catch (error: any) {
      const status = error?.response?.status;
      show({
        message:
          status === 409
            ? t('invites.errorDuplicate', { username: user.username })
            : t('invites.errorSend'),
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <ScreenBackground variant="default">
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <BackButton />
          <Text variant="title">{t('invites.inviteUsers')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {challengeName ? (
          <Text variant="body" tone="secondary" numberOfLines={1}>
            {challengeName}
          </Text>
        ) : null}

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('invites.searchPlaceholder')}
        />

        {searching ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(user) => user.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              query.trim() ? (
                <View style={styles.center}>
                  <Text tone="secondary">{t('invites.searchEmpty')}</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const alreadySent = sentIds.has(item.id);
              return (
                <Card variant="basicGlass" radius="big" padding="md">
                  <Row align="center" gap="md">
                    <UserAvatar
                      username={item.username}
                      imageUrl={item.profile_image_url}
                      size={40}
                    />
                    <View style={styles.userInfo}>
                      <Text variant="subheader" numberOfLines={1}>
                        {item.display_name}
                      </Text>
                      <Text variant="caption" tone="secondary" numberOfLines={1}>
                        @{item.username}
                      </Text>
                    </View>
                    <Button
                      variant={alreadySent ? 'outline' : 'primary'}
                      size="sm"
                      disabled={alreadySent || sendingId !== null}
                      loading={sendingId === item.id}
                      onPress={() => setConfirmUser(item)}
                    >
                      {alreadySent ? t('invites.sentLabel') : t('invites.send')}
                    </Button>
                  </Row>
                </Card>
              );
            }}
          />
        )}
      </View>

      <ConfirmationPopup
        visible={confirmUser !== null}
        title={t('invites.confirmSendTitle')}
        description={t('invites.confirmSendDescription', {
          username: confirmUser?.username ?? '',
          challenge: challengeName,
        })}
        primaryButton={{
          label: t('invites.send'),
          onPress: handleSendConfirmed,
        }}
        secondaryButton={{
          label: t('common.actions.back'),
          onPress: () => setConfirmUser(null),
        }}
        onDismiss={() => setConfirmUser(null)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 40,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
});
