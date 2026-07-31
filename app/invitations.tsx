import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../components/layout/screenBackground';
import { BackButton } from '../components/ui/backButton';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { InviteCard } from '../components/invites/InviteCard';
import { useInvites, InviteAction } from '../hooks/useInvites';
import { useErrorNotificationStore } from '../store/errorNotificationStore';
import { colors, spacing } from '../constants/theme';
import type { ChallengeInviteContract } from '../types/invite';

type InvitesTab = 'received' | 'sent';

const SUCCESS_KEY: Record<InviteAction, string> = {
  accept: 'invites.successAccepted',
  decline: 'invites.successDeclined',
  cancel: 'invites.successCancelled',
};

export default function Invitations() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<InvitesTab>('received');
  const { received, sent, loading, refreshing, error, processingId, refresh, reload, runAction } =
    useInvites();
  const { show, showSuccess } = useErrorNotificationStore();

  const data = tab === 'received' ? received : sent;

  const handleAction = async (action: InviteAction, invite: ChallengeInviteContract) => {
    const ok = await runAction(action, invite.id);
    if (ok) {
      showSuccess({ message: t(SUCCESS_KEY[action], { challenge: invite.challenge?.name ?? '' }) });
    } else {
      show({ message: t('invites.errorAction') });
    }
  };

  return (
    <ScreenBackground variant="default">
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <BackButton />
          <Text variant="title">{t('invites.screenTitle')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabs}>
          <Button
            variant={tab === 'received' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setTab('received')}
            style={styles.tabButton}
          >
            {t('invites.receivedTab')}
          </Button>
          <Button
            variant={tab === 'sent' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setTab('sent')}
            style={styles.tabButton}
          >
            {t('invites.sentTab')}
          </Button>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text tone="secondary">{t('invites.loadError')}</Text>
            <Button variant="outline" size="sm" onPress={reload}>
              {t('common.actions.continue')}
            </Button>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(invite) => invite.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text tone="secondary">
                  {tab === 'received' ? t('invites.emptyReceived') : t('invites.emptySent')}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <InviteCard
                invite={item}
                direction={tab}
                busy={processingId !== null}
                processing={processingId === item.id}
                onAction={handleAction}
              />
            )}
          />
        )}
      </View>
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
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
