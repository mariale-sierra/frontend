import { StyleSheet } from 'react-native';
import { Skeleton } from '../../ui/skeleton';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { radius, spacing } from '../../../constants/theme';

const INFO_ROW_COUNT = 4;
const CYCLE_ROW_COUNT = 4;

/** Mirrors Challenge-Info's real layout (title + info rows, About, "The
 * cycle" list) — shown while the one `getChallenge()` fetch is in flight,
 * instead of a bare centered spinner. */
export function ChallengeInfoContentSkeleton() {
  return (
    <Stack gap="lg" style={styles.wrap}>
      <Skeleton width={200} height={30} />

      <Stack gap="sm">
        {Array.from({ length: INFO_ROW_COUNT }, (_, index) => (
          <Row key={index} gap="md" align="center">
            <Skeleton width={22} height={22} radius={radius.small} />
            <Stack gap="xs" style={styles.infoRowText}>
              <Skeleton width={70} height={10} />
              <Skeleton width="70%" height={14} />
            </Stack>
          </Row>
        ))}
      </Stack>

      <Stack gap="sm">
        <Skeleton height={12} />
        <Skeleton height={12} />
        <Skeleton width="60%" height={12} />
      </Stack>

      <Stack gap="sm">
        {Array.from({ length: CYCLE_ROW_COUNT }, (_, index) => (
          <Skeleton key={index} height={62} radius={radius.medium} />
        ))}
      </Stack>
    </Stack>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },
  infoRowText: {
    flex: 1,
  },
});
