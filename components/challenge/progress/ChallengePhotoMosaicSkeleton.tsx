import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { radius, spacing } from '../../../constants/theme';
import type { ChallengePhoto } from '../../../types/challenge';

interface ChallengePhotoMosaicSkeletonProps {
  width: number;
  photos: ChallengePhoto[];
  totalDays: number;
  bottomInset: number;
  onPressPhoto: (photoId: string) => void;
}

export function ChallengePhotoMosaicSkeleton({
  width,
  photos,
  totalDays,
  bottomInset,
  onPressPhoto,
}: ChallengePhotoMosaicSkeletonProps) {
  const horizontalPadding = spacing.lg;
  const gap = spacing.sm;
  const itemSize = Math.floor((width - horizontalPadding * 2 - gap * 2) / 3);

  // Only show squares for photos that have actually been uploaded, capped at totalDays
  const cells = photos.slice(0, totalDays);

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
        {cells.map((photo) => (
          <Pressable
            key={photo.id}
            onPress={() => onPressPhoto(photo.id)}
            style={({ pressed }) => [
              styles.photoCell,
              pressed && styles.pressed,
              { width: itemSize, height: itemSize },
            ]}
          >
            {photo.imageUrl ? (
              <Image source={{ uri: photo.imageUrl }} style={styles.photoImage} resizeMode="cover" />
            ) : (
              <View style={styles.innerGlow} />
            )}
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
  photoCell: {
    borderRadius: radius.lg,
    backgroundColor: '#3A3A3D',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
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
