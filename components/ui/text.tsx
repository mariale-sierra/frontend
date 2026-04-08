import {
  Text as RNText,
  TextProps as RNTextProps,
} from 'react-native';
import { typography, colors } from '../../constants/theme';

/**
 * TextVariant defines the available text styles:
 * - title: Large (28px), bold (700), white color, for main headings
 * - subheader: Medium (18px), semi-bold (600), white color, uppercase, for subheadings
 * - header: Standard (16px) but semi-bold (600), gray color, for section headers
 * - body: Standard (16px), normal (400), white color, for main content
 * - bodySecondary: Standard (16px), normal (400), gray color, for secondary content
 * - caption: Small (12px), normal (400), muted gray color, for captions
 * - label: Small (12px), medium (500), gray color, uppercase, for labels
 */
type TextVariant =
  | 'title'
  | 'subheader'
  | 'header'
  | 'body'
  | 'bodySecondary'
  | 'caption'
  | 'label';

/**
 * TextProps defines all configurable props for the Text component.
 *
 * In addition to the custom props below, this interface extends React Native's
 * Text props (`RNTextProps`), so you can also pass native props like
 * `numberOfLines`, `ellipsizeMode`, `selectable`, `onPress`, and accessibility props.
 *
 * @property variant - Preset typography style and default color (default: 'body')
 * @property align - Horizontal text alignment (`left`, `center`, `right`, `justify`)
 */

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export function Text({
  variant = 'body',
  align,
  style,
  children,
  ...props
}: TextProps) {
  const variantMap = {
    title: {
      ...typography.title,
      color: colors.textPrimary,
    },
    subheader: {
      ...typography.header,
      color: colors.textPrimary,
    },
    header: {
      ...typography.body,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    body: {
      ...typography.body,
      color: colors.textPrimary,
    },
    bodySecondary: {
      ...typography.body,
      color: colors.textSecondary,
    },
    caption: {
      ...typography.caption,
      color: colors.textMuted,
    },
    label: {
      ...typography.label,
      color: colors.textSecondary,
    },
  } as const;

  return (
    <RNText
      style={[
        variantMap[variant],
        align && { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}