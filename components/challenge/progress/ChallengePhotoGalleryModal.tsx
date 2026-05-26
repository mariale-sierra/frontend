import { FlatList, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, radius, spacing, typography } from '../../../constants/theme';
import type { PublicChallengePhoto } from '../../../services/mocks/publicChallengePhotos';

interface ChallengePhotoGalleryModalProps {
  visible: boolean;
  photos: PublicChallengePhoto[];
  selectedPhotoId: string | null;
  selectedDay: number | null;
  onClose: () => void;
}

function orderPhotosForFeed(photos: PublicChallengePhoto[], selectedPhotoId: string | null) {
  if (!selectedPhotoId) return photos;

  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);
  if (!selectedPhoto) return photos;

  return [
    selectedPhoto,
    ...photos.filter((photo) => photo.id !== selectedPhotoId),
  ];
}

function PhotoFeedItem({ photo }: { photo: PublicChallengePhoto }) {
  return (
    <View style={styles.feedCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text variant="caption" style={styles.avatarInitial}>
            {photo.userName.slice(0, 1).toUpperCase()}
          </Text>
        </View>

        <View style={styles.postHeaderText}>
          <Text variant="header" tone="primary" numberOfLines={1} style={styles.userName}>
            {photo.userName}
          </Text>
          <Text variant="caption" style={styles.eyebrow}>
            Day {photo.day}
          </Text>
        </View>
      </View>

      <View style={styles.photoFrameCard}>
        {photo.imageUrl ? (
          <Image source={{ uri: photo.imageUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Icon name="image-outline" size={42} color="rgba(255,255,255,0.46)" />
          </View>
        )}
      </View>

      <View style={styles.postBody}>
        <Text variant="body" tone="secondary" style={styles.description}>
          {photo.description}
        </Text>

        <View style={styles.metricsBlock}>
          {photo.metrics.map((metric) => (
            <View key={`${photo.id}-${metric.label}`} style={styles.metricRow}>
              <Text variant="body" tone="secondary" style={styles.metricLabel}>{metric.label}</Text>
              <Text variant="body" style={styles.metricValue}>{metric.value}</Text>
            </View>
          ))}
        </View>
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
    const relevantPhotos = selectedDay != null
      ? photos.filter((photo) => photo.day === selectedDay)
      : photos;

    return orderPhotosForFeed(relevantPhotos, selectedPhotoId);
  }, [photos, selectedDay, selectedPhotoId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.actions.back')}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Icon name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.headerText}>
            <Text variant="caption" style={styles.eyebrow}>
              {selectedDay != null
                ? t('challengeProgress.gallery.dayLabel', { day: selectedDay })
                : t('challengeProgress.gallery.publicLabel')}
            </Text>
            <Text variant="header" tone="primary" numberOfLines={1} style={styles.headerTitle}>
              {t('challengeProgress.gallery.feedTitle')}
            </Text>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  headerTitle: {
    letterSpacing: 1.4,
  },
  feedContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  feedCard: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    backgroundColor: 'rgba(28,28,30,0.92)',
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3A3D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  avatarInitial: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  postHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    letterSpacing: 1,
  },
  eyebrow: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.52)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  photoFrameCard: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#343437',
  },
  postBody: {
    padding: spacing.md,
    gap: spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
  },
  metricsBlock: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  metricRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: spacing.md,
  },
  metricLabel: {
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    fontWeight: '700',
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
  pressed: {
    opacity: 0.78,
  },
});
