import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { BackButton } from '../../../../components/ui/backButton';
import { IconButton } from '../../../../components/ui/iconButton';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { Button } from '../../../../components/ui/button';
import { ConfirmationPopup } from '../../../../components/ui/confirmationPopup';
import { Row } from '../../../../components/layout/row';
import { useSpace } from '../../../../hooks/useSpace';
import { joinSpace, leaveSpace } from '../../../../services/spaces/spaces.service';
import { getSpaceAccentColor, getSpaceMembershipCta } from '../../../../services/adapters/spaceAdapter';
import { formatCount } from '../../../../utils/format';
import { colors, radius, spacing } from '../../../../constants/theme';

const HEADER_SIDE_SIZE = 44;

/**
 * Space info screen — Sprint 8 Bloque 2's "2. INFORMACIÓN DEL SPACE"
 * requirement. No single wireframe covers this exact screen (Chats-47B's
 * "Space thread" would be the real destination for tapping a space card,
 * but real-time messaging inside a space is out of this block's scope —
 * see the Spaces delivery report's Pendientes section), so this follows the
 * closest existing analogous pattern in the app instead of inventing new
 * visual language: Challenge-Info's shape (accent-colored card, description,
 * a tappable member count row, a bottom CTA), using the space's own Activity
 * Color as a left-border accent on the info card (wireframe 46A/47C's own
 * badge/border treatment) rather than ChallengeAccentGlow's full-screen glow
 * — that glow's confirmed scope is challenge screens only.
 */
export default function SpaceInfoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const spaceId = typeof id === 'string' && id.length > 0 ? id : null;
  const { space, loading, error, reload } = useSpace(spaceId);
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);

  async function handleJoin() {
    if (!spaceId) return;
    setActionLoading(true);
    try {
      await joinSpace(spaceId);
      reload();
    } catch {
      // Global api.ts interceptor already surfaces an error toast.
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    if (!spaceId) return;
    setActionLoading(true);
    try {
      await leaveSpace(spaceId);
      setLeaveConfirmVisible(false);
      router.back();
    } catch {
      setActionLoading(false);
    }
  }

  const accentColor = space ? getSpaceAccentColor(space) : colors.primary;
  const cta = space ? getSpaceMembershipCta(space) : null;

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton style={styles.headerSideButton} />
        <Text variant="body" weight="bold" align="center" numberOfLines={1} style={styles.headerTitle}>
          {space?.name ?? ''}
        </Text>
        {cta?.kind === 'owner' ? (
          <IconButton
            name="ellipsis-horizontal-outline"
            size={HEADER_SIDE_SIZE}
            onPress={() => router.push(`/messaging/spaces/${spaceId}/manage`)}
            accessibilityLabel={t('spaces.optionsA11y')}
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error || !space ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('spaces.infoLoadError')}</Text>
          <Button variant="outline" size="sm" onPress={reload}>
            {t('common.actions.continue')}
          </Button>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.card, { borderLeftColor: accentColor }]}>
            {space.activityCategory && (
              <View style={[styles.badge, { backgroundColor: accentColor }]}>
                <Text variant="caption" weight="bold" style={styles.badgeText}>
                  {space.activityCategory.name}
                </Text>
              </View>
            )}
            <Text variant="title">{space.name}</Text>
            {space.description ? (
              <Text variant="body" tone="secondary">
                {space.description}
              </Text>
            ) : null}

            <Row gap="xs" justify="flex-start">
              <Icon
                name={space.visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                size={16}
                color={colors.paper}
              />
              <Text variant="caption" tone="secondary">
                {t(space.visibility === 'public' ? 'spaces.visibilityPublicTitle' : 'spaces.visibilityPrivateTitle')}
              </Text>
            </Row>

            <Row
              gap="xs"
              justify="flex-start"
              pressable
              onPress={() => router.push(`/messaging/spaces/${spaceId}/members`)}
            >
              <Icon name="people-outline" size={16} color={colors.paper} />
              <Text variant="caption" tone="secondary">
                {t('spaces.membersCount', { count: formatCount(space.membersCount) })}
              </Text>
              <Icon name="chevron-forward-outline" size={14} color={colors.paper} />
            </Row>
          </View>

          <View style={styles.actions}>
            {cta?.kind === 'owner' && (
              <>
                <Button onPress={() => router.push(`/messaging/spaces/${spaceId}/manage`)}>
                  {t('spaces.editTitle')}
                </Button>
                {space.visibility === 'private' && (
                  <Button
                    variant="outline"
                    onPress={() => router.push(`/messaging/spaces/${spaceId}/join-requests`)}
                  >
                    {t('spaces.joinRequestsRowLabel')}
                  </Button>
                )}
              </>
            )}
            {cta?.kind === 'member' && (
              <>
                <Text tone="secondary" align="center">
                  {t('spaces.joinedLabel')}
                </Text>
                <Button variant="outline" onPress={() => setLeaveConfirmVisible(true)}>
                  {t('spaces.leaveCta')}
                </Button>
              </>
            )}
            {cta?.kind === 'pending' && (
              <Button variant="outline" disabled>
                {t('spaces.pendingCta')}
              </Button>
            )}
            {cta?.kind === 'join' && (
              <Button loading={actionLoading} onPress={handleJoin}>
                {t('spaces.joinCta')}
              </Button>
            )}
            {cta?.kind === 'request' && (
              <Button variant="neutral" loading={actionLoading} onPress={handleJoin}>
                {t('spaces.requestCta')}
              </Button>
            )}
          </View>
        </View>
      )}

      <ConfirmationPopup
        visible={leaveConfirmVisible}
        title={t('spaces.leaveConfirmTitle')}
        description={t('spaces.leaveConfirmMessage')}
        icon="log-out-outline"
        iconColor={colors.error}
        primaryButton={{
          label: t('spaces.leaveCta'),
          onPress: handleLeave,
          variant: 'danger',
          loading: actionLoading,
        }}
        secondaryButton={{
          label: t('spaces.cancelCta'),
          onPress: () => setLeaveConfirmVisible(false),
          variant: 'neutral',
          disabled: actionLoading,
        }}
        onDismiss={() => setLeaveConfirmVisible(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerSideButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: HEADER_SIDE_SIZE,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.big,
    borderLeftWidth: 4,
    padding: spacing.base,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.ink,
    opacity: 1,
  },
  actions: {
    gap: spacing.md,
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
