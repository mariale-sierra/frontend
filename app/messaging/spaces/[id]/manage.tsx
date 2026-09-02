import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { BackButton } from '../../../../components/ui/backButton';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { Button } from '../../../../components/ui/button';
import { ConfirmationPopup } from '../../../../components/ui/confirmationPopup';
import { Row } from '../../../../components/layout/row';
import { SpaceForm } from '../../../../components/spaces/SpaceForm';
import { useSpace } from '../../../../hooks/useSpace';
import { deleteSpace, updateSpace } from '../../../../services/spaces/spaces.service';
import { activityTypeForCategoryCode } from '../../../../services/adapters/spaceAdapter';
import { colors, radius, spacing } from '../../../../constants/theme';
import type { CreateSpacePayload } from '../../../../types/space';

/** "Manage space" — wireframe Chats-47C. Same screen shape as create.tsx
 * (wraps the shared SpaceForm), plus the owner-only Members/Join-requests
 * rows and Delete action that only make sense once the space already
 * exists. */
export default function ManageSpaceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const spaceId = typeof id === 'string' && id.length > 0 ? id : null;
  const { space, loading, error } = useSpace(spaceId);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  async function handleSubmit(payload: CreateSpacePayload) {
    if (!spaceId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateSpace(spaceId, payload);
      router.back();
    } catch {
      setSubmitError(t('spaces.saveError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!spaceId) return;
    setDeleting(true);
    try {
      await deleteSpace(spaceId);
      setDeleteConfirmVisible(false);
      router.dismissTo('/messaging/spaces');
    } catch {
      setDeleting(false);
    }
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Text variant="title">{t('spaces.editTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error || !space ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('spaces.infoLoadError')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SpaceForm
            initialValues={{
              name: space.name,
              description: space.description ?? '',
              visibility: space.visibility,
              activityType: space.activityCategory
                ? activityTypeForCategoryCode(space.activityCategory.code)
                : null,
            }}
            previewMembersCount={space.membersCount}
            submitLabel={t('spaces.saveCta')}
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleSubmit}
          />

          <Row
            justify="space-between"
            align="center"
            pressable
            onPress={() => router.push(`/messaging/spaces/${spaceId}/members`)}
            style={styles.row}
          >
            <Row gap="sm" align="center">
              <Icon name="people-outline" size={20} color={colors.paper} />
              <Text variant="body" weight="bold">
                {t('spaces.membersRowLabel')}
              </Text>
            </Row>
            <Row gap="xs" align="center">
              <Text tone="secondary">{space.membersCount}</Text>
              <Icon name="chevron-forward-outline" size={16} color={colors.paper} />
            </Row>
          </Row>

          {space.visibility === 'private' && (
            <Row
              justify="space-between"
              align="center"
              pressable
              onPress={() => router.push(`/messaging/spaces/${spaceId}/join-requests`)}
              style={styles.row}
            >
              <Row gap="sm" align="center">
                <Icon name="person-add-outline" size={20} color={colors.paper} />
                <Text variant="body" weight="bold">
                  {t('spaces.joinRequestsRowLabel')}
                </Text>
              </Row>
              <Icon name="chevron-forward-outline" size={16} color={colors.paper} />
            </Row>
          )}

          <Row
            justify="flex-start"
            gap="sm"
            align="center"
            pressable
            onPress={() => setDeleteConfirmVisible(true)}
            style={styles.deleteRow}
          >
            <Icon name="trash-outline" size={20} color={colors.error} />
            <Text variant="body" weight="bold" style={styles.deleteLabel}>
              {t('spaces.deleteCta')}
            </Text>
          </Row>
        </ScrollView>
      )}

      <ConfirmationPopup
        visible={deleteConfirmVisible}
        title={t('spaces.deleteConfirmTitle')}
        description={t('spaces.deleteConfirmMessage')}
        icon="trash-outline"
        iconColor={colors.error}
        primaryButton={{
          label: t('spaces.deleteCta'),
          onPress: handleDelete,
          variant: 'danger',
          loading: deleting,
        }}
        secondaryButton={{
          label: t('spaces.cancelCta'),
          onPress: () => setDeleteConfirmVisible(false),
          variant: 'neutral',
          disabled: deleting,
        }}
        onDismiss={() => setDeleteConfirmVisible(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.base,
  },
  deleteRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.base,
  },
  deleteLabel: {
    color: colors.error,
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
