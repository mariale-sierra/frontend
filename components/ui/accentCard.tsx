import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { AccentGlow } from './accentGlow';
import { borderWidth, colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

// A soft outline in the accent color (`borderWidth.fine`, at 30%) around a dark
// `ink` card, with a Skia glow from one edge (the bottom by default) — the same
// two-tone half-moon light as the Challenge-Info / progress backdrop
// (`AccentDome`), at card scale, so the card reads as lit from that edge in the
// accent color. The half-moon is 62% of the card's width at its edge and reaches
// 80% of the way across; no blur (cheap in a long list). Kept subtle on purpose:
// the color should read as light behind the content, never so strong that pastel
// activity colors and `paper` text stop pairing.
const OUTLINE_OPACITY = 0.3;
const GLOW = {
  domeHalfWidth: 0.62,
  domeDepth: 0.8,
  washPeak: 0.24,
  bloomPeak: 0.1,
  grainOpacity: 0.02,
} as const;

interface AccentCardProps extends ViewProps {
  /** The accent color (a challenge's or a Space's own Activity Color). */
  color: string;
  /** The edge the glow comes from. Default `bottom`. */
  glowEdge?: 'top' | 'bottom';
}

/**
 * A card in one accent color: a soft outline in that color, and a glow of it
 * coming from one edge (the bottom by default), on `ink`. The card every
 * challenge and Space card is built on, so they read as one family. Padded `md`
 * by default — override it, and set the size, through `style`; children render
 * on top of the glow.
 *
 * The glow is a confirmed exception to "no gradients" (2026-09-20). Drop the
 * `<AccentGlow>` below to get the flat outlined card back.
 */
export function AccentCard({ color, glowEdge = 'bottom', style, children, ...props }: AccentCardProps) {
  return (
    <View {...props} style={[styles.card, { borderColor: withAlpha(color, OUTLINE_OPACITY) }, style]}>
      <AccentGlow color={color} edge={glowEdge} {...GLOW} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink,
    borderRadius: radius.big,
    // borderColor set inline — the accent color, softened.
    borderWidth: borderWidth.fine,
    padding: spacing.md,
    // Clips the glow to the rounded corners.
    overflow: 'hidden',
  },
});
