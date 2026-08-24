import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { Icon } from '../../ui/icon';
import type { ChallengePhoto } from '../../../types/challenge';

interface ChallengePhotoMosaicSkeletonProps {
  width: number;
  photos: ChallengePhoto[];
  totalDays: number;
  onPressPhoto: (photoId: string) => void;
}

const COLUMNS = 3;

/**
 * Grid view of the Consistency section — same underlying per-day photo data
 * as the Calendar view (see ChallengeActiveProgressScreen), just as a photo
 * mosaic instead of a dotted calendar. Image tiles follow the standing
 * Image/photo-tile rule (`small` radius, 4:5 aspect ratio, `sm` grid gap —
 * see Components → Card variants) rather than the wireframe's literal
 * 114×141px, same normalization already applied to the Profile grid.
 *
 * Plain content `View`, no own ScrollView — the whole screen scrolls as one
 * (ChallengeActiveProgressScreen), so this just contributes its natural
 * content height rather than being clipped to a fixed pager height.
 */
export function ChallengePhotoMosaicSkeleton({ width, photos, totalDays, onPressPhoto }: ChallengePhotoMosaicSkeletonProps) {
  const horizontalPadding = spacing.base;
  const gap = spacing.sm;
  const itemWidth = (width - horizontalPadding * 2 - gap * (COLUMNS - 1)) / COLUMNS;

  const cells = photos.slice(0, totalDays);

  return (
    <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
      <View style={[styles.grid, { gap }]}>
        {cells.map((photo) => (
          <Pressable
            key={photo.id}
            onPress={() => onPressPhoto(photo.id)}
            style={({ pressed }) => [styles.photoCell, pressed && styles.pressed, { width: itemWidth }]}
          >
            {photo.imageUrl ? (
              <Image source={{ uri: photo.imageUrl }} style={styles.photoImage} resizeMode="cover" />
            ) : (
              <View style={styles.innerGlow} />
            )}

            <View style={styles.visibilityBadge}>
              <Icon
                name={photo.visibility === 'public' ? 'eye-outline' : 'camera-outline'}
                size={14}
                color={photo.visibility === 'public' ? colors.primary : colors.paper}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // No paddingTop — the wireframe's grid container has none (`padding: 0
  // 16px`); the "Consistency" toggle row above (screen-level
  // consistencyHeader) already contributes the only vertical gap via its
  // own paddingBottom, same fix as ChallengeWorkoutCalendar's `page`.
  content: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoCell: {
    aspectRatio: 4 / 5,
    borderRadius: radius.small,
    backgroundColor: colors.surface,
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
    backgroundColor: withAlpha(colors.paper, 0.08),
  },
  visibilityBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radius.small,
    backgroundColor: withAlpha(colors.ink, 0.72),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
