import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, radius, spacing } from '../../constants/theme';
import { Text } from '../ui/text';
import { getMyProgressPhotos } from '../../services/challenge/challenge.service';
import type { ChallengePhoto } from '../../types/challenge';

interface PostsGridProps {
  view: 'posts' | 'photos';
  onPhotoPress?: (photo: ChallengePhoto) => void;
}

function PhotoTile({
  photo,
  onPress,
}: {
  photo: ChallengePhoto;
  onPress?: () => void;
}) {
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

const SKELETON_COUNT = 8;

export function PostsGrid({ view: _view, onPhotoPress }: PostsGridProps) {
  const [photos, setPhotos] = useState<ChallengePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Refetches on focus (not just on mount) so a photo uploaded elsewhere
  // shows up here when the user comes back to the profile tab.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getMyProgressPhotos()
        .then((data) => {
          if (active) setPhotos(data);
        })
        .catch(() => {
          if (active) setPhotos([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

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
          No progress photos yet. Log a workout with a photo to see it here.
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
