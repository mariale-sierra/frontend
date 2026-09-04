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
import { spacing, radius, colors, textOpacity, fontSize } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

/**
 * InputVariant defines the available input field styles:
 * - default: Minimal style with rounded corners (radius.medium), transparent background,
 *   used for subtle inputs that blend with the background
 * - filled: Background-filled style with rounded corners (radius.medium) and dark surface color,
 *   provides visual emphasis and clear input field boundary
 */
type InputVariant = 'default' | 'filled';

type LabelVariant = 'title' | 'subheader' | 'header';
type PlaceholderVariant = 'body' | 'secondary' | 'caption';

/**
 * InputProps defines all configuration options for the Input component.
 * 
 * @property label - Optional text displayed above the input field
 * @property labelVariant - Text style for the label; 'title' for large bold text, 'subheader' for medium semi-bold, 'header' for the small uppercase eyebrow style (default: 'subheader')
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
  /** Set false to suppress the auto-rendered below-input counter when a caller renders its own (e.g. inline in a label row). Default true. */
  showCounter?: boolean;
  /** Tints the container border `colors.error` when true. The border is
   * always reserved at the same width so toggling this never shifts layout. */
  error?: boolean;
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
  showCounter = true,
  error = false,
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

  // Map placeholder variant to color (paper at the matching opacity tier)
  const placeholderColorMap = {
    body: withAlpha(colors.paper, textOpacity.primary),
    secondary: withAlpha(colors.paper, textOpacity.secondary),
    caption: withAlpha(colors.paper, textOpacity.tertiary),
  } as const;

  return (
    <View style={{ gap: spacing.xs }}>
      
      {/* LABEL */}
      {label && <Text variant={labelVariant}>{label}</Text>}

      {/* INPUT CONTAINER */}
      <Row
        align="center"
        style={[
          styles.container,
          variant === 'filled' && styles.filled,
          error && styles.errorBorder,
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
          textAlignVertical="center"
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
      {maxLength && showCounter && (
        <Text variant="caption">
          {props.value?.toString().length ?? 0}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.medium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    // Reserved at all times (transparent by default) so switching into/out
    // of an error state never shifts the input's box size.
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  filled: {
    backgroundColor: colors.surface,
  },

  errorBorder: {
    borderColor: colors.error,
  },

  input: {
    flex: 1,
    color: colors.paper,
    fontSize: fontSize.base,
    paddingVertical: 0,
    includeFontPadding: false,
  },
});