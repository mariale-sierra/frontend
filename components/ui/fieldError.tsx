import { StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';
import { Text } from './text';

interface FieldErrorProps {
  /** Nothing renders without a message, so callers can pass `error?.message` directly. */
  message?: string | null;
  align?: 'left' | 'center';
  testID?: string;
}

/**
 * The inline validation message under a form field — one look for every form
 * (caption, `error` color) and announced by screen readers when it appears.
 * Used by FormField and by the screens that lay out their own field label.
 */
export function FieldError({ message, align, testID }: FieldErrorProps) {
  if (!message) return null;
  return (
    <Text
      variant="caption"
      align={align}
      style={styles.text}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID={testID}
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.error,
  },
});
