import {
  Text as RNText,
  TextProps as RNTextProps,
} from 'react-native';
import { typography, colors } from '../../constants/theme';

/**
 * TextVariant defines the available text styles:
 * - title: Large (28px), bold (700), white color, for main headings
 * - subheader: Medium (18px), semi-bold (600), white color, uppercase, for subheadings
 * - header: Standard (16px), semi-bold (600), gray by default, optionally white with tone='primary'
 * - body: Standard (16px), normal (400), white by default, optionally gray with tone='secondary'
 * - caption: Small (12px), normal (400), muted gray color, for captions
 * - label: Small (12px), medium (500), gray color, uppercase, for labels
 * - activity: Standard (16px), normal (400), color driven by activity category prop
 */
type TextVariant =
  | 'title'
  | 'subheader'
  | 'header'
  | 'body'
  | 'caption'
  | 'label'
  | 'activity';

type TextTone = 'primary' | 'secondary';

/**
 * TextProps defines all configurable props for the Text component.
 *
 * In addition to the custom props below, this interface extends React Native's
 * Text props (`RNTextProps`), so you can also pass native props like
 * `numberOfLines`, `ellipsizeMode`, `selectable`, `onPress`, and accessibility props.
 *
 * @property variant - Preset typography style and default color (default: 'body')
 * @property align - Horizontal text alignment (`left`, `center`, `right`, `justify`)
 * @property tone - Optional text tone for `header` and `body` variants
 * @property activity - Activity category key; required when variant is 'activity'
 */

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  align?: 'left' | 'center' | 'right' | 'justify';
  tone?: TextTone;
  activity?: keyof typeof colors.activityType;
}

export function Text({
  variant = 'body',
  align,
  tone,
  activity,
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
      color: tone === 'primary' ? colors.textPrimary : colors.textSecondary,
    },
    body: {
      ...typography.body,
      color: tone === 'secondary' ? colors.textSecondary : colors.textPrimary,
    },
    caption: {
      ...typography.caption,
      color: colors.textMuted,
    },
    label: {
      ...typography.label,
      color: colors.textSecondary,
    },
    activity: {
      ...typography.body,
      color: activity ? colors.activityType[activity] : colors.textSecondary,
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