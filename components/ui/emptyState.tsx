import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Button } from './button';
import { Icon } from './icon';
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
  return (
    <View style={styles.container} testID={testID}>
      {illustration ? (
        <Image
          source={illustration}
          style={styles.illustration}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          testID={testID ? `${testID}-illustration` : undefined}
        />
      ) : icon ? (
        <Icon name={icon} size={34} color={withAlpha(colors.paper, textOpacity.tertiary)} />
      ) : null}
      <Text
        variant="body"
        weight={illustration ? undefined : 'bold'}
        align="center"
        tone={muted ? 'tertiary' : illustration ? 'secondary' : undefined}
      >
        {title}
      </Text>
      {message && !illustration ? (
        <Text variant="body" tone="secondary" align="center">
          {message}
        </Text>
      ) : null}
      {actions && actions.length > 0 ? (
        <Row gap="sm" justify="center" style={styles.actions}>
          {actions.map((action) => (
            <Button key={action.label} variant="outline" size="sm" onPress={action.onPress} testID={action.testID}>
              {action.label}
            </Button>
          ))}
        </Row>
      ) : null}
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
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
  },
});
