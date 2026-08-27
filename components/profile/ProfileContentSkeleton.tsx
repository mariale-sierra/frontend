import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { radius, spacing } from '../../constants/theme';

const AVATAR_SIZE = 88;
const TILE_COUNT = 6;

/** Mirrors ProfileHeader (avatar + name/handle + stats row) + the view
 * toggle + a couple of PhotoGrid rows — shown while the one profile fetch
 * is in flight, instead of a bare centered spinner. */
export function ProfileContentSkeleton() {
  return (
    <Stack gap="lg">
      <Stack gap="md" align="center">
        <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} radius={radius.big} strong />
        <Stack gap="xs" align="center">
          <Skeleton width={140} height={16} />
          <Skeleton width={90} height={12} />
        </Stack>
        <Row gap="xl" style={styles.statsRow}>
          <Skeleton width={40} height={32} />
          <Skeleton width={40} height={32} />
          <Skeleton width={40} height={32} />
        </Row>
      </Stack>

      <Skeleton width={128} height={36} radius={radius.big} style={styles.toggle} />

      <View style={styles.grid}>
        {Array.from({ length: TILE_COUNT }, (_, index) => (
          <Skeleton key={index} radius={radius.small} style={styles.tile} />
        ))}
      </View>
    </Stack>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    paddingTop: spacing.sm,
  },
  toggle: {
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '48.5%',
    aspectRatio: 4 / 5,
  },
});
