import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, fillOpacity, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Text } from '../ui/text';
import type { ChallengePhoto } from '../../types/challenge';

const SKELETON_COUNT = 8;

// On the initial profile load, wait for the first visible row's images so
// it does not immediately pop from metadata skeletons to empty tiles. Do
// not prefetch an entire history or reset an already visible grid on every
// focus refresh: both operations create avoidable JS work during tab
// navigation. Remaining tiles use React Native's normal native Image
// loading behavior, and the timeout prevents one broken URL from holding
// the first render indefinitely.
const IMAGE_PRELOAD_TIMEOUT_MS = 6000;
// Only the first row needs to be resident before the initial grid appears.
// Starting a native prefetch promise for an entire photo history on the JS
// thread made the Profile tab's first focus compete with the navbar motion.
// Remaining tiles keep their normal native Image loading behavior.
const INITIAL_IMAGE_PRELOAD_COUNT = 4;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PhotoGridProps {
  photos: ChallengePhoto[];
  loading: boolean;
  emptyLabel: string;
  onPhotoPress?: (photo: ChallengePhoto) => void;
}

const PhotoTile = memo(function PhotoTile({
  photo,
  onPhotoPress,
}: {
  photo: ChallengePhoto;
  onPhotoPress?: (photo: ChallengePhoto) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      onPress={() => onPhotoPress?.(photo)}
    >
      {photo.imageUrl ? (
        <Image source={{ uri: photo.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.skeletonInner} />
      )}
    </Pressable>
  );
});

/** Presentational tile grid shared by PostsGrid (own posts) and other-user
 * profile screens — pure rendering, callers own fetching/filtering. */
export const PhotoGrid = memo(function PhotoGrid({ photos, loading, emptyLabel, onPhotoPress }: PhotoGridProps) {
  const [imagesReady, setImagesReady] = useState(false);
  const hasRenderedContent = useRef(false);

  const preloadInitialImages = useCallback((urls: string[]) => {
    const preload = Promise.allSettled(
      urls.slice(0, INITIAL_IMAGE_PRELOAD_COUNT).map((url) => Image.prefetch(url)),
    );

    return Promise.race([preload, delay(IMAGE_PRELOAD_TIMEOUT_MS)]);
  }, []);

  useEffect(() => {
    if (loading) {
      if (!hasRenderedContent.current) {
        setImagesReady(false);
      }
      return;
    }
    if (photos.length === 0) {
      hasRenderedContent.current = true;
      setImagesReady(true);
      return;
    }

    let cancelled = false;
    const urls = photos.map((photo) => photo.imageUrl).filter((url): url is string => Boolean(url));

    // Once a grid is already on screen, a background refresh must not swap
    // it back to skeletons. The updated cells render immediately and native
    // image loading fills any genuinely new URI; existing cells stay intact.
    if (hasRenderedContent.current) {
      void preloadInitialImages(urls);
      return;
    }

    setImagesReady(false);

    preloadInitialImages(urls).finally(() => {
      if (!cancelled) {
        hasRenderedContent.current = true;
        setImagesReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loading, photos, preloadInitialImages]);

  if (loading || !imagesReady) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <View key={i} style={styles.tile}>
            <View style={styles.skeletonInner}>
              {i === 0 && <ActivityIndicator color={withAlpha(colors.paper, textOpacity.tertiary)} />}
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
        <PhotoTile key={photo.id} photo={photo} onPhotoPress={onPhotoPress} />
      ))}
    </View>
  );
});

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
  // Was `withAlpha(colors.paper, 0.1)` — a one-off value close to, but not
  // quite, the shared Skeleton primitive's own `subtle` fill (0.08),
  // purely because this tile predates that primitive and typed its own
  // number. Converged onto the real shared token — see `fillOpacity`.
  skeletonInner: {
    flex: 1,
    backgroundColor: withAlpha(colors.paper, fillOpacity.subtle),
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
