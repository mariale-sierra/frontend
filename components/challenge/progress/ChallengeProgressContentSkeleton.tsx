import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../../ui/skeleton';
import { Stack } from '../../layout/stack';
import { radius, spacing } from '../../../constants/theme';

const RING_SIZE = 180;
const TILE_COUNT = 9;

/** Mirrors ChallengeProgressHeader (eyebrow + title, the ring, the routine
 * banner) + the grid/calendar toggle + a few photo-mosaic tiles — shown
 * while the one useChallengeActiveProgress fetch is in flight, instead of a
 * bare centered spinner. The ring itself doesn't skeleton naturally (it's a
 * tick-dial, not a rectangle), so it's represented as a plain circle. */
export function ChallengeProgressContentSkeleton() {
  return (
    <Stack gap="lg" align="center" style={styles.wrap}>
      <Stack gap="xs" align="center">
        <Skeleton width={90} height={12} />
        <Skeleton width={160} height={26} />
      </Stack>

      {/* size/2 here on purpose, not `radius.big` — this represents the ring
          itself (a true circle), unlike avatars/badges where `radius.big`
          deliberately clamps small ones into a circle and lets larger ones
          (Profile's 88px avatar) render as a squircle instead. */}
      <Skeleton width={RING_SIZE} height={RING_SIZE} radius={RING_SIZE / 2} strong />

      <Skeleton height={52} radius={radius.big} style={styles.fullWidth} />

      <View style={styles.toggleRow}>
        <Skeleton width={120} height={20} />
        <Skeleton width={72} height={36} radius={radius.big} />
      </View>

      <View style={styles.grid}>
        {Array.from({ length: TILE_COUNT }, (_, index) => (
          <Skeleton key={index} radius={radius.small} style={styles.tile} />
        ))}
      </View>
    </Stack>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  toggleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '31%',
    aspectRatio: 4 / 5,
  },
});
