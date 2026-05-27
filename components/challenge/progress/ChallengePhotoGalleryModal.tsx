import { FlatList, Modal, StyleSheet, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../ui/icon';
import { BackButton } from '../../ui/backButton';
import { Text } from '../../ui/text';
import { PhotoDetailCard } from '../../ui/photoDetailCard';
import { colors, radius, spacing } from '../../../constants/theme';
import type { ChallengePhoto } from '../../../types/challenge';

interface ChallengePhotoGalleryModalProps {
  visible: boolean;
  photos: ChallengePhoto[];
  selectedPhotoId: string | null;
  selectedDay: number | null;
  onClose: () => void;
}

function orderPhotosForFeed(photos: ChallengePhoto[], selectedPhotoId: string | null) {
  if (!selectedPhotoId) return photos;
  const selected = photos.find((p) => p.id === selectedPhotoId);
  if (!selected) return photos;
  return [selected, ...photos.filter((p) => p.id !== selectedPhotoId)];
}


export function ChallengePhotoGalleryModal({
  visible,
  photos,
  selectedPhotoId,
  selectedDay,
  onClose,
}: ChallengePhotoGalleryModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const feedPhotos = useMemo(() => {
    const relevant = selectedDay != null
      ? photos.filter((p) => p.day === selectedDay)
      : photos;
    return orderPhotosForFeed(relevant, selectedPhotoId);
  }, [photos, selectedDay, selectedPhotoId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <BackButton onPress={onClose} />
        </View>

        <FlatList
          data={feedPhotos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PhotoDetailCard photo={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.feedContent,
            { paddingBottom: insets.bottom + spacing['2xl'] },
            feedPhotos.length === 0 && styles.emptyContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Icon name="images-outline" size={34} color="rgba(255,255,255,0.46)" />
              <Text variant="body" tone="secondary" align="center">
                {t('challengeProgress.gallery.emptyMessage')}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  feedContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing['2xl'],
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
});
