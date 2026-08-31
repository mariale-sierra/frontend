import {
  Text as RNText,
  TextProps as RNTextProps,
} from 'react-native';
import { colors, textOpacity, typography } from '../../constants/theme';
import type { FontSizeToken, FontWeightToken } from '../../constants/theme';

/**
 * TextVariant picks the font family/weight/size for a content role, per the
 * design system's Typography scale:
 * - title: Bebas Neue display heading — screen titles (H1)
 * - subheader: Bebas Neue display heading, smaller — section headings (H2/H3)
 * - header: DM Sans bold, small, uppercase — eyebrow/section labels
 * - body: DM Sans regular — default body text
 * - label: DM Sans medium, small — tags, form labels, buttons
 * - caption: DM Sans regular, smallest — timestamps, captions, member counts
 * - activity: same as body. Workout category color-coding is retired — a
 *   category is icon + name only now, rendered like any other label. Kept
 *   as its own variant (and the `activity` prop below) only so existing
 *   call sites still compile during migration; neither affects color.
 */
type TextVariant =
  | 'title'
  | 'subheader'
  | 'header'
  | 'body'
  | 'caption'
  | 'label'
  | 'activity';

/**
 * Opacity tier applied to the text color — see design system Typography →
 * Text opacity scale.
 *
 * ⚠️ This opacity applies unconditionally, even under a custom `color`
 * override passed via `style` (brand/accent colors on a pill, a badge, a
 * "View" link, etc.) — there's no tone value that means "fully opaque," the
 * scale tops out at `primary` (85%). A custom-colored `Text` will render
 * MUTED unless the caller's style also sets `opacity: 1` to cancel this
 * back out. This has already caused real, shipped bugs (Home hero card's
 * status pill, Challenges-Mine's status pill, Explore card's member/view
 * text) — always add `opacity: 1` alongside any `color` override on `Text`.
 */
type TextTone = 'primary' | 'secondary' | 'tertiary' | 'inverse';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  align?: 'left' | 'center' | 'right' | 'justify';
  tone?: TextTone;
  /** Render on a light/lime surface using `ink` instead of `paper` as the base color. */
  inverse?: boolean;
  /** Override the variant's default size with another token from the fontSize scale. */
  size?: FontSizeToken;
  /** Override the variant's default weight with another DM Sans weight token. Has no visible effect on `title`/`subheader` (Bebas Neue only ships one weight). */
  weight?: FontWeightToken;
  /**
   * @deprecated Workout category is icon + name only, never color-coded —
   * this no longer affects rendering. Kept only so pre-existing call sites
   * (`<Text variant="activity" activity={type} />`) still compile.
   */
  activity?: string;
}

// @expo-google-fonts ships each DM Sans weight as its OWN font family name
// (DMSans_400Regular / _500Medium / _700Bold), not one family switched via
// `fontWeight`. Setting `fontWeight` alone without also pointing
// `fontFamily` at the matching file renders the wrong weight silently (the
// loaded family's own weight wins) — every DM Sans style below, and the
// `weight` override, must set both together.
const DM_SANS_FAMILY: Record<FontWeightToken, string> = {
  regular: typography.fontFamily.regular,
  medium: typography.fontFamily.medium,
  bold: typography.fontFamily.bold,
};

function dmSans(weight: FontWeightToken) {
  return {
    fontFamily: DM_SANS_FAMILY[weight],
    fontWeight: typography.fontWeight[weight],
  };
}

const VARIANT_STYLE = {
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.lineHeight['3xl'],
    letterSpacing: typography.bebasLetterSpacing(typography.fontSize['3xl']),
  },
  subheader: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    letterSpacing: typography.bebasLetterSpacing(typography.fontSize.xl),
  },
  header: {
    ...dmSans('bold'),
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    textTransform: 'uppercase' as const,
  },
  body: {
    ...dmSans('regular'),
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
  },
  label: {
    ...dmSans('medium'),
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  caption: {
    ...dmSans('regular'),
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
  activity: {
    ...dmSans('regular'),
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
  },
} as const;

const DISPLAY_VARIANTS = new Set<TextVariant>(['title', 'subheader']);

export function Text({
  variant = 'body',
  align,
  tone = 'primary',
  inverse = false,
  size,
  weight,
  activity: _activity,
  style,
  children,
  ...props
}: TextProps) {
  const useInk = inverse || tone === 'inverse';
  const opacityTier = tone === 'inverse' ? 'primary' : tone;
  const isDisplay = DISPLAY_VARIANTS.has(variant);

  const sizeOverride = size && {
    fontSize: typography.fontSize[size],
    lineHeight: typography.lineHeight[size],
    ...(isDisplay && { letterSpacing: typography.bebasLetterSpacing(typography.fontSize[size]) }),
  };

  return (
    <RNText
      style={[
        VARIANT_STYLE[variant],
        { color: useInk ? colors.ink : colors.paper, opacity: textOpacity[opacityTier] },
        sizeOverride,
        weight && !isDisplay && dmSans(weight),
        align && { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
