import { StyleSheet, View } from 'react-native';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, spacing } from '../../../constants/theme';
import { challengeCardText } from './challengeCardText';

const ICON_SIZE = 20;
const ICON_SIZE_COMPACT = 16;

interface ChallengeCardMembersProps {
  /** The already-formatted member count ("1.2k members"). */
  label: string;
  /** `md` (default): the challenge cards' footer. `sm`: a compact row, for
   * Space cards. */
  size?: 'md' | 'sm';
}

/** A people icon and the member count — the footer of Explore challenge cards
 * (`md`) and Space cards (`sm`). (An icon rather than member profile pictures: no endpoint returns
 * those for a list of challenges or spaces.) */
export function ChallengeCardMembers({ label, size = 'md' }: ChallengeCardMembersProps) {
  const compact = size === 'sm';

  return (
    <View style={styles.row}>
      <Icon name="people-outline" size={compact ? ICON_SIZE_COMPACT : ICON_SIZE} color={colors.primary} />
      <Text variant={compact ? 'caption' : 'label'} weight="bold" style={challengeCardText.primary}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
