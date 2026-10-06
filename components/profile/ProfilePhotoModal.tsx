import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../ui/backButton';
import { IconButton } from '../ui/iconButton';
import { ConfirmationPopup } from '../ui/confirmationPopup';
import { PhotoDetailCard } from '../ui/photoDetailCard';
import { colors, spacing } from '../../constants/theme';
import type { ChallengePhoto } from '../../types/challenge';

interface ProfilePhotoModalProps {
  photo: ChallengePhoto | null;
  onClose: () => void;
  /** Only your own profile passes this (B4) — another user's photos can't
   * be deleted from here. Resolves once the post is gone; rejects (and keeps
   * the confirmation open) if the request failed. */
  onDelete?: (photo: ChallengePhoto) => Promise<void>;
}

export function ProfilePhotoModal({ photo, onClose, onDelete }: ProfilePhotoModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // A different photo (or none) never inherits the previous one's open popup.
  useEffect(() => {
    setConfirmVisible(false);
  }, [photo]);

  async function confirmDelete() {
    if (!photo || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(photo);
      setConfirmVisible(false);
    } catch {
      // Global axios interceptor already shows the error toast.
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      visible={photo !== null}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <BackButton onPress={onClose} />
          {onDelete && photo ? (
            <IconButton
              name="trash-outline"
              iconSize={22}
              iconColor={colors.error}
              onPress={() => setConfirmVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('home.postOptions.deleteA11y')}
              hitSlop={10}
              testID="profile-photo-delete"
            />
          ) : null}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['2xl'] },
          ]}
        >
          {photo && <PhotoDetailCard photo={photo} />}
        </ScrollView>
      </View>

      {/* Rendered inside this Modal's own tree, so it presents on top of
          the full-screen photo instead of racing a second top-level Modal. */}
      <ConfirmationPopup
        visible={confirmVisible}
        title={t('home.postOptions.deleteConfirmTitle')}
        description={t('home.postOptions.deleteConfirmDescription')}
        icon="trash-outline"
        iconColor={colors.error}
        primaryButton={{
          label: t('home.postOptions.deleteConfirmCta'),
          onPress: confirmDelete,
          variant: 'danger',
          loading: deleting,
        }}
        secondaryButton={{
          label: t('home.postOptions.cancelCta'),
          onPress: () => setConfirmVisible(false),
          variant: 'neutral',
          disabled: deleting,
        }}
        onDismiss={() => !deleting && setConfirmVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
});
