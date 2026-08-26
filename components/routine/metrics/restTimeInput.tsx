import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../ui/text';
import { Row } from '../../layout/row';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface RestTimeInputProps {
  label?: string;
  minutes: string;
  seconds: string;
  onChangeMinutes: (value: string) => void;
  onChangeSeconds: (value: string) => void;
}

/**
 * RestTimeInput - Reusable time input component for rest periods or durations
 * Used where time needs to be split into minutes and seconds with the 
 * consistent exercise metrics styling.
 */
export function RestTimeInput({
  label = 'Rest time',
  minutes,
  seconds,
  onChangeMinutes,
  onChangeSeconds,
}: RestTimeInputProps) {
  return (
    <View style={styles.field}>
      <Text variant="label" tone="secondary">{label}</Text>
      <Row justify="flex-start" align="center" gap="sm" style={styles.restRow}>
        <TextInput
          keyboardType="numeric"
          value={minutes}
          onChangeText={onChangeMinutes}
          style={[styles.input, styles.restInput]}
          placeholder="0"
          placeholderTextColor={withAlpha(colors.paper, textOpacity.tertiary)}
        />
        <Text variant="caption" tone="secondary" style={styles.restUnit}>min</Text>
        <TextInput
          keyboardType="numeric"
          value={seconds}
          onChangeText={onChangeSeconds}
          style={[styles.input, styles.restInput]}
          placeholder="0"
          placeholderTextColor={withAlpha(colors.paper, textOpacity.tertiary)}
        />
        <Text variant="caption" tone="secondary" style={styles.restUnit}>sec</Text>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 40,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: withAlpha(colors.paper, 0.12),
    color: colors.paper,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  restRow: {
    paddingTop: spacing.xs,
  },
  restInput: {
    width: 78,
  },
  restUnit: {
    minWidth: 24,
    textAlign: 'center',
  },
});
