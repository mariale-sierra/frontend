import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { BackButton } from '../../../../components/ui/backButton';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { Button } from '../../../../components/ui/button';
import { ConfirmationPopup } from '../../../../components/ui/confirmationPopup';
import { Row } from '../../../../components/layout/row';
import { SpaceForm } from '../../../../components/spaces/SpaceForm';
import type { SpaceFormHandle } from '../../../../components/spaces/SpaceForm';
import { useSpace } from '../../../../hooks/useSpace';
import { deleteSpace, updateSpace } from '../../../../services/spaces/spaces.service';
import { activityTypeForCategoryCode } from '../../../../services/adapters/spaceAdapter';
import { colors, radius, spacing } from '../../../../constants/theme';
import { withAlpha } from '../../../../utils/color';
import type { CreateSpacePayload } from '../../../../types/space';

/** "Manage space" — wireframe Chats-47C. Same screen shape as create.tsx
 * (wraps the shared SpaceForm), plus the owner-only Members row and Delete
 * action that only make sense once the space already exists. The
 * Join-requests row that used to live here was removed — obsolete now that
 * the people icon in the space thread's own header (Chats-47B) is the real
 * entry point to Chats-47E, per the actual wireframe. */
export default function ManageSpaceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const spaceId = typeof id === 'string' && id.length > 0 ? id : null;
  const { space, loading, error } = useSpace(spaceId);
  const formRef = useRef<SpaceFormHandle>(null);
  const [accentColor, setAccentColor] = useState<string>(colors.primary);
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
        <>
          <View style={styles.contentWrap}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <SpaceForm
                ref={formRef}
                initialValues={{
                  name: space.name,
                  description: space.description ?? '',
                  visibility: space.visibility,
                  activityType: space.activityCategory
                    ? activityTypeForCategoryCode(space.activityCategory.code)
                    : null,
                }}
                previewMembersCount={space.membersCount}
                onAccentColorChange={setAccentColor}
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
          </View>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            {/* Always visible regardless of scroll position — real, reported
                confusion when this lived inside SpaceForm's own scrollable
                content instead (past the Privacy section, easy to never
                scroll down to see after tapping Save from higher up). */}
            {submitError ? (
              <Text variant="caption" style={styles.submitError}>
                {submitError}
              </Text>
            ) : null}
            <Button
              onPress={() => formRef.current?.submit()}
              loading={submitting}
              textWeight="bold"
              style={{ backgroundColor: accentColor }}
            >
              {t('spaces.saveCta')}
            </Button>
          </View>
        </>
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
    paddingBottom: spacing.lg,
  },
  headerSpacer: {
    width: 40,
  },
  contentWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  // Same sticky-footer chrome as the metrics screen's own bottom bar
  // (app/(add)/metrics.tsx) — a surface-colored bar above the safe-area
  // inset, separated from scrollable content by a hairline border, so
  // "Save changes" stays fixed at the bottom instead of scrolling away.
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  submitError: {
    color: colors.error,
    marginBottom: spacing.sm,
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
