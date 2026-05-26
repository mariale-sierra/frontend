import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { radius, spacing } from '../../../constants/theme';
import type { PublicChallengePhoto } from '../../../services/mocks/publicChallengePhotos';

interface ChallengePhotoMosaicSkeletonProps {
  width: number;
  photos: PublicChallengePhoto[];
  bottomInset: number;
  onPressPhoto: (photoId: string) => void;
}

const MIN_VISIBLE_CELLS = 18;

export function ChallengePhotoMosaicSkeleton({
  width,
  photos,
  bottomInset,
  onPressPhoto,
}: ChallengePhotoMosaicSkeletonProps) {
  const horizontalPadding = spacing.lg;
  const gap = spacing.sm;
  const itemSize = Math.floor((width - horizontalPadding * 2 - gap * 2) / 3);
  const cells = Array.from(
    { length: Math.max(MIN_VISIBLE_CELLS, photos.length) },
    (_, index) => photos[index] ?? null,
  );

  return (
    <ScrollView
      style={[styles.page, { width }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: horizontalPadding,
          paddingBottom: bottomInset + spacing['2xl'],
        },
      ]}
      showsVerticalScrollIndicator={false}
      directionalLockEnabled
      nestedScrollEnabled
      bounces
    >
      <View style={styles.grid}>
        {cells.map((photo, index) => (
          <Pressable
            key={photo?.id ?? `empty-${index}`}
            disabled={!photo}
            onPress={() => {
              if (photo) onPressPhoto(photo.id);
            }}
            style={({ pressed }) => [
              styles.placeholder,
              photo && styles.photoPlaceholder,
              pressed && styles.pressed,
              {
                width: itemSize,
                height: itemSize,
              },
            ]}
          >
            {photo && <View style={styles.innerGlow} />}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  placeholder: {
    borderRadius: radius.lg,
    backgroundColor: '#2E2E30',
    opacity: 0.82,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    backgroundColor: '#3A3A3D',
    opacity: 1,
  },
  innerGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '44%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pressed: {
    opacity: 0.72,
  },
});
