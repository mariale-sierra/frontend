import { StyleSheet, View } from 'react-native';
import { Row } from '../../layout/row';
import { Text } from '../../ui/text';
import { IconButton } from '../../ui/iconButton';
import { colors, radius, spacing } from '../../../constants/theme';

interface ValueStepperProps {
  label: string;
  valueLabel: string;
  onIncrease: () => void;
  onDecrease: () => void;
  decreaseDisabled?: boolean;
}

/** Label + [–][value][+] pill row — the routine builder's Sets / Reps per
 * set / Rest between sets controls. Whole row is an `ink` track; minus/plus
 * reuse the shared `IconButton` (`variant="surface"`, radius overridden to
 * `big` so it reads as a circle) instead of bespoke buttons; the value itself
 * is the one `primary`-filled pill, matching the wireframe exactly. */
export function ValueStepper({ label, valueLabel, onIncrease, onDecrease, decreaseDisabled = false }: ValueStepperProps) {
  return (
    <View style={styles.track}>
      <Text variant="label" weight="medium" tone="secondary">{label}</Text>

      <Row align="center" gap="sm">
        <IconButton
          name="remove-outline"
          variant="surface"
          size={32}
          iconSize={14}
          iconColor={colors.paper}
          onPress={onDecrease}
          disabled={decreaseDisabled}
          style={[styles.stepButton, decreaseDisabled && styles.stepButtonDisabled]}
        />

        <View style={styles.valuePill}>
          <Text variant="label" weight="bold" style={styles.valueText}>{valueLabel}</Text>
        </View>

        <IconButton
          name="add-outline"
          variant="surface"
          size={32}
          iconSize={14}
          iconColor={colors.paper}
          onPress={onIncrease}
          style={styles.stepButton}
        />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: radius.big,
    backgroundColor: colors.ink,
    paddingLeft: spacing.base,
    paddingRight: spacing.xs,
  },
  stepButton: {
    borderRadius: radius.big,
    borderWidth: 0,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  valuePill: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    color: colors.ink,
    opacity: 1,
  },
});
