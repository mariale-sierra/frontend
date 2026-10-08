import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { IconStack } from '../layout/iconStack';
import { colors, radius } from '../../constants/theme';
import type { ReactorViewModel } from '../../services/adapters/feedAdapter';

const MAX_NAMES = 2;
const AVATAR_SIZE = 20;

interface ReactorsSummaryProps {
  /** People who reacted, never including the viewer (backend
   * `recent_reactors`). */
  reactors: ReactorViewModel[];
  likedByMe: boolean;
  /** Total reactions. Only used to know whether there are more people than
   * the ones named — it's never shown (Sprint 10, B5: the redesign shows WHO
   * reacted, not a number to compare against other posts). */
  totalCount: number;
  onPress: () => void;
}

function displayName(reactor: ReactorViewModel): string {
  return reactor.displayName || `@${reactor.username}`;
}

/**
 * "Tú, Ana y otras personas" under a post, with their avatars. Renders
 * nothing when nobody reacted. Taps open the full list (ReactorsSheet).
 */
export function ReactorsSummary({ reactors, likedByMe, totalCount, onPress }: ReactorsSummaryProps) {
  const { t } = useTranslation();
  if (totalCount <= 0 && !likedByMe) return null;

  const named = reactors.slice(0, MAX_NAMES).map(displayName);
  const people = likedByMe ? [t('reactions.you'), ...named] : named;
  // Someone reacted but the summary couldn't name them (e.g. an older API
  // without `recent_reactors`) — still lead with people, generically.
  const hasOthers = totalCount - (likedByMe ? 1 : 0) - named.length > 0;

  let label: string;
  if (people.length === 0) {
    label = t('reactions.somePeople');
  } else if (hasOthers) {
    label = t('reactions.namesAndOthers', { names: people.join(', ') });
  } else if (people.length === 1) {
    label = likedByMe ? t('reactions.onlyYou') : t('reactions.byOne', { name: people[0] });
  } else {
    label = t('reactions.byTwo', { first: people.slice(0, -1).join(', '), last: people[people.length - 1] });
  }

  const avatars = reactors.slice(0, 3);

  return (
    <Row
      pressable
      onPress={onPress}
      gap="sm"
      align="center"
      justify="flex-start"
      accessibilityRole="button"
      accessibilityLabel={t('reactions.openListA11y')}
      testID="reactors-summary"
    >
      {avatars.length > 0 ? (
        <IconStack max={3}>
          {avatars.map((reactor) => (
            <View key={reactor.id} style={styles.avatarRing}>
              <UserAvatar username={reactor.username} imageUrl={reactor.avatarUrl} size={AVATAR_SIZE} />
            </View>
          ))}
        </IconStack>
      ) : null}
      <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  // Same ring as the Spaces member stack, so overlapping avatars read as
  // separate people.
  avatarRing: {
    borderRadius: radius.big,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  label: {
    flexShrink: 1,
  },
});
