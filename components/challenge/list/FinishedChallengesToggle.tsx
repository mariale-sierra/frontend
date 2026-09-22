import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { Row } from '../../layout/row';
import { colors, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface FinishedChallengesToggleProps {
  /** How many finished (`won`) challenges are hidden/revealed by this toggle. */
  count: number;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * The Challenges-Mine list's disclosure for finished challenges — collapsed by
 * default so a growing history of completed challenges doesn't bunch up with
 * the ones still active/in progress at the top of the list (per explicit
 * request 2026-09-22: "I dont want them bunched up with the active ones").
 *
 * A plain expand/collapse row at the END of the list (`ListFooterComponent`,
 * see `app/(tabs)/challenges.tsx`) rather than a separate tab, screen, or
 * modal — this is a filter over the same list, not a different data set, so
 * the standard "there's N more below, tap to reveal" disclosure pattern
 * (GitHub's "N closed issues," a collapsed Done column) fits without adding
 * new navigation. Only rendered at all when there IS at least one finished
 * challenge (see the caller).
 */
export function FinishedChallengesToggle({ count, expanded, onToggle }: FinishedChallengesToggleProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      <Row gap="xs" justify="center" align="center">
        <Text variant="label" weight="bold" tone="secondary">
          {expanded ? t('challenges.hideFinishedChallenges') : t('challenges.showFinishedChallenges', { count })}
        </Text>
        <Icon
          name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={16}
          color={withAlpha(colors.paper, textOpacity.secondary)}
        />
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
