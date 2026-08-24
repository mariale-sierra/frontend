import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
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
              {i === 0 && <ActivityIndicator color={withAlpha(colors.paper, 0.3)} />}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="body" tone="secondary" align="center">
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
  },
  tile: {
    width: '48.5%',
    // Wireframe tiles are ~175×214 (2-col grid at a 390px screen width,
    // `sm` gap) — that's a 4:5 ratio, not 3:4. Using aspectRatio (not a
    // fixed height) so it holds up at real device widths.
    aspectRatio: 4 / 5,
    borderRadius: radius.small,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeletonInner: {
    flex: 1,
    backgroundColor: withAlpha(colors.paper, 0.1),
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
});
