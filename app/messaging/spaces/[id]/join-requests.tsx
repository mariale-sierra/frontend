import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { BackButton } from '../../../../components/ui/backButton';
import { Text } from '../../../../components/ui/text';
import { JoinRequestListItem } from '../../../../components/spaces/JoinRequestListItem';
import { useSpaceJoinRequests } from '../../../../hooks/useSpaceJoinRequests';
import { approveSpaceJoinRequest, rejectSpaceJoinRequest } from '../../../../services/spaces/spaces.service';
import { colors, spacing } from '../../../../constants/theme';

/** Wireframe Chats-47E — pending join requests for a private space, owner
 * only (enforced server-side; this screen is only ever linked to from the
 * owner's own "Manage space"/info screens). */
export default function SpaceJoinRequestsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const spaceId = typeof id === 'string' && id.length > 0 ? id : null;
  const { requests, loading, error, reload } = useSpaceJoinRequests(spaceId);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  async function handleApprove(requestId: string) {
    if (!spaceId) return;
    setPendingRowId(requestId);
    setPendingAction('approve');
    try {
      await approveSpaceJoinRequest(spaceId, requestId);
      reload();
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setPendingRowId(null);
      setPendingAction(null);
    }
  }

  async function handleReject(requestId: string) {
    if (!spaceId) return;
    setPendingRowId(requestId);
    setPendingAction('reject');
    try {
      await rejectSpaceJoinRequest(spaceId, requestId);
      reload();
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setPendingRowId(null);
      setPendingAction(null);
    }
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Text variant="title">{t('spaces.joinRequestsTitle')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('spaces.joinRequestsLoadError')}</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <JoinRequestListItem
              request={item}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
              pendingAction={pendingRowId === item.id ? pendingAction : null}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="secondary">{t('spaces.joinRequestsEmpty')}</Text>
            </View>
          }
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
