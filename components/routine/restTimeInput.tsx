import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';

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
      <Text variant="label" style={styles.fieldLabel}>{label}</Text>
      <Row justify="flex-start" align="center" gap="sm" style={styles.restRow}>
        <TextInput
          keyboardType="numeric"
          value={minutes}
          onChangeText={onChangeMinutes}
          style={[styles.input, styles.restInput]}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
        <Text variant="caption" style={styles.restUnit}>min</Text>
        <TextInput
          keyboardType="numeric"
          value={seconds}
          onChangeText={onChangeSeconds}
          style={[styles.input, styles.restInput]}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
        <Text variant="caption" style={styles.restUnit}>sec</Text>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  fieldLabel: {
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  input: {
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.24)',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  restRow: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  restInput: {
    width: 78,
  },
  restUnit: {
    color: colors.textSecondary,
    minWidth: 24,
    textAlign: 'center',
  },
});
