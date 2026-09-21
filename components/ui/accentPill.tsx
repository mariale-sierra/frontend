import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from './icon';
import { Text } from './text';
import { colors, glass, radius, spacing } from '../../constants/theme';
import { GlassBackdrop, glassBorderStyle } from './glassSurface';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface AccentPillProps {
  label: string;
  /** The accent color the `filled` pill is filled with. Ignored by the others. */
  color?: string;
  /** `filled`: accent fill, `ink` text (a call to action). `surface`: a plain
   * `surface` fill with muted text — no accent, no outline (a disabled/pending
   * state; it was an outline pill until 2026-09-20). `glass`: frosted glass — the
   * nav bar's blur and hairline rim, with a lighter `surface` tint — with `paper`
   * icon and label, a neutral badge that lets what is behind it show through. */
  variant?: 'filled' | 'surface' | 'glass';
  /** `md` (default): a button-sized pill (Space cards' Join / Request). `sm`: a
   * compact badge (the challenge cards' state / category badge). */
  size?: 'md' | 'sm';
  /** A leading icon, in `ink` (`paper` on a `glass` pill). */
  icon?: IconName;
  /** Sets the label in capitals. */
  uppercase?: boolean;
  /** A trailing arrow, for "go" actions ("Join", "View"). */
  arrow?: boolean;
  /** Shows a spinner in place of the label and blocks presses. */
  loading?: boolean;
  /** Makes the pill a button. Leave unset when the pill sits inside something
   * that's already pressable (a card), so it's just a label. */
  onPress?: () => void;
}

/**
 * A pill-shaped accent label: Space cards' Join / Request / Pending (`md`), and
 * the challenge cards' state and category badges (`sm`). Accent-filled with
 * `ink` text, so it pairs with any activity color.
 */
export function AccentPill({
  label,
  color = colors.primary,
  variant = 'filled',
  size = 'md',
  icon,
  uppercase = false,
  arrow = false,
  loading = false,
  onPress,
}: AccentPillProps) {
  const filled = variant === 'filled';
  const plain = variant === 'surface';
  const compact = size === 'sm';
  const style = [
    styles.pill,
    compact ? styles.pillCompact : styles.pillRegular,
    filled ? { backgroundColor: color } : plain ? styles.surface : styles.glass,
    loading && styles.loading,
  ];
  const iconSize = compact ? ICON_SIZE_COMPACT : ICON_SIZE;
  // `ink` on the accent fill, `paper` on a glass pill.
  const foreground = variant === 'glass' ? colors.paper : colors.ink;

  const content = loading ? (
    <ActivityIndicator size="small" color={foreground} />
  ) : (
    <View style={styles.content}>
      {icon ? <Icon name={icon} size={iconSize} color={foreground} /> : null}
      <Text
        variant={compact ? 'caption' : 'label'}
        weight="bold"
        tone={plain ? 'secondary' : 'primary'}
        numberOfLines={1}
        style={[styles.label, filled && styles.filledText, uppercase && styles.uppercase]}
      >
        {label}
      </Text>
      {arrow ? <Icon name="arrow-forward-outline" size={iconSize} color={foreground} /> : null}
    </View>
  );
  const body = (
    <>
      {variant === 'glass' ? <GlassBackdrop tintOpacity={glass.badgeTintOpacity} /> : null}
      {content}
    </>
  );

  if (!onPress) {
    return <View style={style}>{body}</View>;
  }

  return (
    <Pressable onPress={onPress} disabled={loading} hitSlop={8} accessibilityRole="button" style={style}>
      {body}
    </Pressable>
  );
}

const ICON_SIZE = 16;
const ICON_SIZE_COMPACT = 14;

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.big,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRegular: {
    paddingHorizontal: spacing.md,
    minHeight: 32,
    minWidth: 32,
  },
  // A badge sized by its content — the caption text plus `xs` above and below.
  pillCompact: {
    paddingHorizontal: spacing.sm,
  },
  // backgroundColor set inline for `filled` — the accent color.
  surface: {
    backgroundColor: colors.surface,
  },
  // The glass is its own layers (`GlassBackdrop`); the pill clips them to its shape.
  glass: {
    overflow: 'hidden',
    ...glassBorderStyle,
  },
  loading: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  // Lets a long label truncate inside the pill instead of pushing it wider than
  // whatever it sits in.
  label: {
    flexShrink: 1,
  },
  // Text's tone-opacity (85% by default) applies even to a custom `color`
  // override — cancel it back to fully opaque, since this is `ink` on an accent
  // fill, not `paper` body text.
  filledText: {
    color: colors.ink,
    opacity: 1,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
