import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { Text } from '../ui/text';
import type { ChallengePhoto } from '../../types/challenge';

const SKELETON_COUNT = 8;

interface PhotoGridProps {
  photos: ChallengePhoto[];
  loading: boolean;
  emptyLabel: string;
  onPhotoPress?: (photo: ChallengePhoto) => void;
}

function PhotoTile({ photo, onPress }: { photo: ChallengePhoto; onPress?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      onPress={onPress}
    >
      {photo.imageUrl ? (
        <Image source={{ uri: photo.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.skeletonInner} />
      )}
    </Pressable>
  );
}

/** Presentational tile grid shared by PostsGrid (own posts) and other-user
 * profile screens — pure rendering, callers own fetching/filtering. */
export function PhotoGrid({ photos, loading, emptyLabel, onPhotoPress }: PhotoGridProps) {
  if (loading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <View key={i} style={styles.tile}>
            <View style={styles.skeletonInner}>
              {i === 0 && <ActivityIndicator color={colors.textMuted} />}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="body" align="center" style={styles.emptyText}>
          {emptyLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <PhotoTile key={photo.id} photo={photo} onPress={() => onPhotoPress?.(photo)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  tile: {
    width: '48.5%',
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeletonInner: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  empty: {
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
  },
});
