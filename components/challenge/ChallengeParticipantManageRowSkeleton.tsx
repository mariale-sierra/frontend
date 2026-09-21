import { StyleSheet } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { Row } from '../layout/row';
import { PARTICIPANT_AVATAR_SIZE, PARTICIPANT_REMOVE_BUTTON_SIZE } from './ChallengeParticipantManageRow';
import { radius, spacing } from '../../constants/theme';

/** What Manage-challenge shows in place of a participant row while they load: the same
 * avatar, name and one round button, as plain blocks (like the app's other skeletons). */
export function ChallengeParticipantManageRowSkeleton() {
  return (
    <Row align="center" gap="md" style={styles.row}>
      <Skeleton width={PARTICIPANT_AVATAR_SIZE} height={PARTICIPANT_AVATAR_SIZE} radius={radius.big} strong />
      <Skeleton width="45%" height={spacing.base} style={styles.name} />
      <Skeleton
        width={PARTICIPANT_REMOVE_BUTTON_SIZE}
        height={PARTICIPANT_REMOVE_BUTTON_SIZE}
        radius={radius.big}
        strong
      />
    </Row>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.xs,
  },
  name: {
    flex: 1,
  },
});
