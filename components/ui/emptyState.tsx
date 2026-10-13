import { StyleSheet, View } from 'react-native';
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
  icon: IconName;
  title: string;
  message?: string;
  /** Where to go next: an empty screen should point somewhere, not dead-end. Two read well. */
  actions?: EmptyStateAction[];
  testID?: string;
}

/**
 * Shared "nothing here yet" block: icon, bold title, a muted message and up to
 * two outline buttons toward the relevant place (challenges, people). Same look
 * as the Home feed's empty state, which it generalizes.
 */
export function EmptyState({ icon, title, message, actions, testID }: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Icon name={icon} size={34} color={withAlpha(colors.paper, textOpacity.tertiary)} />
      <Text variant="body" weight="bold" align="center">
        {title}
      </Text>
      {message ? (
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
});
