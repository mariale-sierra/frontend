import {
  View,
  TextInput,
  StyleSheet,
  StyleProp,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
  ViewStyle,
} from 'react-native';
import { useState } from 'react';
import { Text } from './text';
import { Row } from '../layout/row';
import { spacing, radius, colors } from '../../constants/theme';

/**
 * InputVariant defines the available input field styles:
 * - default: Minimal style with rounded corners (radius.lg), transparent background, 
 *   used for subtle inputs that blend with the background
 * - filled: Background-filled style with rounded corners (radius.lg) and dark surface color,
 *   provides visual emphasis and clear input field boundary
 */
type InputVariant = 'default' | 'filled';

type LabelVariant = 'title' | 'subheader';
type PlaceholderVariant = 'body' | 'secondary' | 'caption';

/**
 * InputProps defines all configuration options for the Input component.
 * 
 * @property label - Optional text displayed above the input field
 * @property labelVariant - Text style for the label; 'title' for large bold text, 'subheader' for medium semi-bold (default: 'subheader')
 * @property placeholder - Optional hint text displayed inside the input when empty
 * @property placeholderVariant - Text color style for the placeholder; 'body' (primary), 'secondary' (secondary), or 'caption' (muted) (default: 'body')
 * @property leftIcon - Optional icon or element rendered on the left side of the input
 * @property rightIcon - Optional icon or element rendered on the right side of the input
 * @property variant - Input field style; 'default' (minimal/transparent) or 'filled' (dark background) (default: 'default')
 * @property multiline - Whether the input supports multiple lines; adjusts height dynamically (default: false)
 * @property maxLength - Maximum character limit; displays character count below input when set (default: undefined)
 */
interface InputProps extends TextInputProps {
  label?: string;
  labelVariant?: LabelVariant;
  placeholder?: string;
  placeholderVariant?: PlaceholderVariant;
  containerStyle?: StyleProp<ViewStyle>;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  variant?: InputVariant;

  multiline?: boolean;
  maxLength?: number;
}

export function Input({
  label,
  labelVariant = 'subheader',
  placeholder,
  placeholderVariant = 'body',
  containerStyle,
  leftIcon,
  rightIcon,
  variant = 'default',
  multiline = false,
  maxLength,
  style,
  ...props
}: InputProps) {
  const [height, setHeight] = useState(40);

  function handleContentSizeChange(
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) {
    if (multiline) {
      setHeight(e.nativeEvent.contentSize.height);
    }
  }

  // Map placeholder variant to color
  const placeholderColorMap = {
    body: colors.textPrimary,
    secondary: colors.textSecondary,
    caption: colors.textMuted,
  } as const;

  return (
    <View style={{ gap: spacing.xs }}>
      
      {/* LABEL */}
      {label && <Text variant={labelVariant}>{label}</Text>}

      {/* INPUT CONTAINER */}
      <Row
        align="center"
        padding="sm"
        style={[
          styles.container,
          variant === 'filled' && styles.filled,
          containerStyle,
        ]}
      >
        {leftIcon}

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={placeholderColorMap[placeholderVariant]}
          multiline={multiline}
          maxLength={maxLength}
          onContentSizeChange={handleContentSizeChange}
          style={[
            styles.input,
            multiline && { height: Math.max(40, height) },
            style,
          ]}
          {...props}
        />

        {rightIcon}
      </Row>

      {/* MAX LENGTH */}
      {maxLength && (
        <Text variant="caption">
          {props.value?.toString().length ?? 0}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
  },

  filled: {
    backgroundColor: colors.surface,
  },

  input: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});