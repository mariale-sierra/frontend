import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Button } from './button';
import { Icon } from './icon';
import { IllustratedBlock } from './illustratedBlock';
import { Text } from './text';
import { Row } from '../layout/row';

type IconName = React.ComponentProps<typeof Icon>['name'];

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
  testID?: string;
}

interface EmptyStateProps {
  /** Ignored when there is an `illustration`. */
  icon?: IconName;
  /** Sprint 10: a neutral-palette illustration (assets/illustrations) in place
   * of the icon. With one, the block is just the illustration, the `title` as a
   * single line and the actions — no `message`. */
  illustration?: ImageSourcePropType;
  title: string;
  message?: string;
  /** Where to go next: an empty screen should point somewhere, not dead-end. Two read well. */
  actions?: EmptyStateAction[];
  /** Sets the title in the icon's own muted tone (`tertiary`) instead of full
   * `primary` — a quiet hint rather than a statement (Search's starting state). */
  muted?: boolean;
  testID?: string;
}

/** The illustration's side (the source PNGs are 512, for sharp 3x screens). */
export const ILLUSTRATION_SIZE = 120;

/**
 * Shared "nothing here yet" block: icon, bold title, a muted message and up to
 * two outline buttons toward the relevant place (challenges, people). Same look
 * as the Home feed's empty state, which it generalizes.
 */
export function EmptyState({ icon, illustration, title, message, actions, muted = false, testID }: EmptyStateProps) {
  const actionRow =
    actions && actions.length > 0 ? (
      <Row gap="sm" justify="center" style={styles.actions}>
        {actions.map((action) => (
          <Button key={action.label} variant="outline" size="sm" onPress={action.onPress} testID={action.testID}>
            {action.label}
          </Button>
        ))}
      </Row>
    ) : null;

  // Sprint 10: with an illustration the whole block waits behind a skeleton
  // until the picture loads, then appears at once.
  if (illustration) {
    return (
      <IllustratedBlock
        source={illustration}
        size={ILLUSTRATION_SIZE}
        actionCount={actions?.length ?? 0}
        style={styles.container}
        testID={testID}
        imageTestID={testID ? `${testID}-illustration` : undefined}
      >
        <Text variant="body" align="center" tone={muted ? 'tertiary' : 'secondary'}>
          {title}
        </Text>
        {actionRow}
      </IllustratedBlock>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {icon ? <Icon name={icon} size={34} color={withAlpha(colors.paper, textOpacity.tertiary)} /> : null}
      <Text variant="body" weight="bold" align="center" tone={muted ? 'tertiary' : undefined}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" tone="secondary" align="center">
          {message}
        </Text>
      ) : null}
      {actionRow}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  actions: {
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
});
