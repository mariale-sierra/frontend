import { Pressable, StyleSheet } from 'react-native';
import { Row } from '../../layout/row';
import { Text } from '../../ui/text';
import { Icon } from '../../ui/icon';
import { colors, radius, spacing } from '../../../constants/theme';

interface ValueStepperProps {
  label: string;
  valueLabel: string;
  onIncrease: () => void;
  onDecrease: () => void;
  decreaseDisabled?: boolean;
}

/** Label + [–][value][+] row — the routine builder's Sets / Reps per set /
 * Rest between sets controls. Minus button is `ink`, plus is `primary`,
 * matching the wireframe exactly. */
export function ValueStepper({ label, valueLabel, onIncrease, onDecrease, decreaseDisabled = false }: ValueStepperProps) {
  return (
    <Row justify="space-between" align="center">
      <Text variant="label" weight="medium" tone="secondary">{label}</Text>

      <Row align="center" gap="md">
        <Pressable
          onPress={onDecrease}
          disabled={decreaseDisabled}
          style={({ pressed }) => [styles.button, styles.buttonMinus, pressed && !decreaseDisabled && styles.pressed, decreaseDisabled && styles.disabled]}
        >
          <Icon name="remove-outline" size={14} color={colors.paper} />
        </Pressable>

        <Text variant="body" weight="bold" style={styles.value}>{valueLabel}</Text>

        <Pressable
          onPress={onIncrease}
          style={({ pressed }) => [styles.button, styles.buttonPlus, pressed && styles.pressed]}
        >
          <Icon name="add-outline" size={14} color={colors.ink} />
        </Pressable>
      </Row>
    </Row>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMinus: {
    backgroundColor: colors.ink,
  },
  buttonPlus: {
    backgroundColor: colors.primary,
  },
  value: {
    minWidth: 32,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.4,
  },
});
