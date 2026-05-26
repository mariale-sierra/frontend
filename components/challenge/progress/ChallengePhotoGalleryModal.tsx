import { FlatList, Image, Modal, StyleSheet, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../ui/icon';
import { BackButton } from '../../ui/backButton';
import { Text } from '../../ui/text';
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

function PhotoFeedItem({ photo }: { photo: ChallengePhoto }) {
  return (
    <View style={styles.feedItem}>
      <View style={styles.photoFrame}>
        {photo.imageUrl ? (
          <Image source={{ uri: photo.imageUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Icon name="image-outline" size={42} color="rgba(255,255,255,0.46)" />
          </View>
        )}

        <View style={styles.photoOverlay}>
          <View style={styles.overlayAvatar}>
            <Text style={styles.overlayAvatarInitial}>
              {photo.userName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.overlayUserName}>{photo.userName}</Text>
            <Text style={styles.overlayDay}>Day {photo.day}</Text>
          </View>
        </View>
      </View>

      <View style={styles.postBody}>
        {!!photo.description && (
          <Text variant="body" tone="secondary" style={styles.description}>
            {photo.description}
          </Text>
        )}

        {photo.metrics.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.metricsTable}>
              {photo.metrics.map((metric, index) => (
                <View
                  key={`${photo.id}-${metric.label}`}
                  style={[
                    styles.metricRow,
                    index === photo.metrics.length - 1 && styles.metricRowLast,
                  ]}
                >
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
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
          renderItem={({ item }) => <PhotoFeedItem photo={item} />}
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
  feedItem: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(18,18,18,0.65)',
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  overlayAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3A3A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayAvatarInitial: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 14,
  },
  overlayUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 16,
  },
  overlayDay: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.54)',
    lineHeight: 14,
  },
  postBody: {
    padding: spacing.md,
    gap: spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  metricsTable: {
    backgroundColor: colors.background,
  },
  metricRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: spacing.md,
  },
  metricRowLast: {
    borderBottomWidth: 0,
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.44)',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
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
