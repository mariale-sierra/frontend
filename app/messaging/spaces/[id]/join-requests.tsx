import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { BackButton } from '../../../../components/ui/backButton';
import { Row } from '../../../../components/layout/row';
import { Text } from '../../../../components/ui/text';
import { JoinRequestListItem } from '../../../../components/spaces/JoinRequestListItem';
import { useSpace } from '../../../../hooks/useSpace';
import { useSpaceJoinRequests } from '../../../../hooks/useSpaceJoinRequests';
import { approveSpaceJoinRequest, rejectSpaceJoinRequest } from '../../../../services/spaces/spaces.service';
import { getSpaceAccentColor } from '../../../../services/adapters/spaceAdapter';
import { colors, radius, spacing } from '../../../../constants/theme';

/** Wireframe Chats-47E — pending join requests for a private space, owner
 * only (enforced server-side; this screen is only ever linked to from the
 * owner's own space thread/"Manage space" screens). */
export default function SpaceJoinRequestsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const spaceId = typeof id === 'string' && id.length > 0 ? id : null;
  const { space } = useSpace(spaceId);
  const { requests, loading, error, reload } = useSpaceJoinRequests(spaceId);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const accentColor = space ? getSpaceAccentColor(space) : colors.primary;

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
        <BackButton style={styles.headerSideButton} />
        <View style={styles.headerTextBlock}>
          <Text variant="body" weight="bold" numberOfLines={1}>
            {t('spaces.joinRequestsTitle')}
          </Text>
          {space?.activityCategory && (
            <Row gap="xs" align="center" justify="flex-start">
              <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
              <Text
                variant="caption"
                weight="bold"
                numberOfLines={1}
                style={[styles.categoryLabel, { color: accentColor }]}
              >
                {t('spaces.categorySubtitle', { name: space.activityCategory.name })}
              </Text>
            </Row>
          )}
        </View>
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
  headerSideButton: {
    marginLeft: -spacing.sm,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: radius.big,
  },
  // Custom `color` override on `Text` needs an explicit `opacity: 1` — see
  // the same note in app/messaging/spaces/[id]/index.tsx's thread header.
  categoryLabel: {
    opacity: 1,
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
