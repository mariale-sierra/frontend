import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../components/layout/screenBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { IconButton } from '../components/ui/iconButton';
import { Icon } from '../components/ui/icon';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { NotificationListItem } from '../components/notifications/NotificationListItem';
import { NotificationListSkeleton } from '../components/notifications/NotificationListSkeleton';
import { PushPermissionCard } from '../components/notifications/PushPermissionCard';
import { useNotificationsInbox } from '../hooks/useNotificationsInbox';
import { usePushPermission } from '../hooks/usePushPermission';
import { useNotificationsStore } from '../store/notificationsStore';
import {
  openNotificationTarget,
  resolveNotificationTarget,
} from '../services/notifications/notificationRoutes';
import { colors, spacing, textOpacity } from '../constants/theme';
import { withAlpha } from '../utils/color';
import type { NotificationContract } from '../types/notification';

/**
 * B3 notification inbox: newest first, paginated, read/unread, tap opens the
 * related screen (and marks it read), mark-all, and the contextual push
 * permission ask. Settings live in app/notification-settings.tsx.
 */
export default function Notifications() {
  const { t } = useTranslation();
  const router = useRouter();
  const inbox = useNotificationsInbox();
  const push = usePushPermission();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const handlePress = useCallback(
    (notification: NotificationContract) => {
      inbox.markRead(notification);
      void openNotificationTarget(
        router,
        resolveNotificationTarget({
          type: notification.type,
          entityType: notification.entity.type,
          entityId: notification.entity.id,
          data: notification.data,
        }),
      );
    },
    [inbox.markRead, router],
  );

  const showMarkAll = !inbox.loading && (inbox.hasUnread || unreadCount > 0);

  const listHeader = (
    <View style={styles.listHeader}>
      {push.showCard && push.state ? (
        <PushPermissionCard
          state={push.state}
          busy={push.requesting}
          onEnable={push.enable}
          onOpenSettings={push.openSettings}
          onDismiss={push.dismiss}
        />
      ) : null}
      {showMarkAll ? (
        <Pressable
          onPress={inbox.markAllRead}
          disabled={inbox.markingAll}
          accessibilityRole="button"
          accessibilityLabel={t('notifications.markAllReadA11y')}
          hitSlop={8}
          style={({ pressed }) => [styles.markAll, (pressed || inbox.markingAll) && styles.pressed]}
        >
          <Text variant="label" weight="bold" style={styles.markAllText}>
            {t('notifications.markAllRead')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <ScreenBackground variant="default">
      <ScreenHeader
        title={t('notifications.title')}
        trailing={
          <IconButton
            name="settings-outline"
            iconSize={22}
            onPress={() => router.push('/notification-settings')}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.settingsA11y')}
            hitSlop={10}
          />
        }
      />

      {inbox.loading ? (
        <View style={styles.content}>
          <NotificationListSkeleton />
        </View>
      ) : inbox.error ? (
        <View style={styles.center}>
          <Text tone="secondary" align="center">
            {t('notifications.loadError')}
          </Text>
          <Button variant="outline" size="sm" onPress={inbox.reload}>
            {t('notifications.retry')}
          </Button>
        </View>
      ) : (
        <FlatList
          testID="notifications-list"
          data={inbox.notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationListItem notification={item} onPress={handlePress} />}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<EmptyInbox />}
          ListFooterComponent={
            inbox.loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
          }
          onEndReached={inbox.hasMore ? inbox.loadMore : undefined}
          onEndReachedThreshold={0.4}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={inbox.refreshing} onRefresh={inbox.refresh} tintColor={colors.primary} />
          }
        />
      )}
    </ScreenBackground>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function EmptyInbox() {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <Icon name="notifications-outline" size={32} color={withAlpha(colors.paper, textOpacity.tertiary)} />
      <Text variant="body" weight="bold" align="center">
        {t('notifications.emptyTitle')}
      </Text>
      <Text variant="caption" tone="secondary" align="center">
        {t('notifications.emptyBody')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  listHeader: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  markAll: {
    alignSelf: 'flex-end',
  },
  markAllText: {
    color: colors.primary,
    opacity: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  separator: {
    height: spacing.xs,
  },
  footer: {
    paddingVertical: spacing.base,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
});
