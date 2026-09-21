import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { AccentDome } from './accentDome';
import { AccentGlow } from './accentGlow';
import { AccentMesh } from './accentMesh';
import { AccentTwinDome } from './accentTwinDome';
import { borderWidth, colors, radius, spacing } from '../../constants/theme';
import type { MeshRecipe } from '../../constants/meshRecipes';
import { withAlpha } from '../../utils/color';

// A soft outline in the accent color (`borderWidth.fine`, at 30%) around a dark
// card, with a Skia glow behind the content: by default the same two-tone
// half-moon light as the Challenge-Info / progress backdrop (`AccentDome`), at
// card scale, raised from the bottom edge — 62% of the card's width at the edge,
// reaching 80% of the way up; no blur (cheap in a long list). Kept subtle on
// purpose: the color should read as light behind the content, never so strong
// that pastel activity colors and `paper` text stop pairing. Given a `glowRecipe`,
// the glow is that recipe's mesh instead (`AccentMesh`) — very large, dim,
// multicolor fields that fade into the same `ink` — on the same outlined card.
const OUTLINE_OPACITY = 0.3;
const DOME = {
  domeHalfWidth: 0.62,
  domeDepth: 0.8,
  washPeak: 0.24,
  bloomPeak: 0.1,
  grainOpacity: 0.02,
} as const;
// The twin glow (Space cards): a half-moon from the top edge AND one from the bottom,
// each reaching about halfway in, so a little softer than the single one above.
const TWIN_DOME = {
  domeHalfWidth: 0.62,
  domeDepth: 0.5,
  washPeak: 0.2,
  bloomPeak: 0.09,
  grainOpacity: 0.02,
} as const;
const MESH_GRAIN = 0.02;

interface AccentCardProps extends ViewProps {
  /** The accent color (a challenge's or a Space's own Activity Color). */
  color: string;
  /** Draws the glow as this mesh recipe (see `getMeshRecipe`) instead of the plain
   * half-moon from the bottom edge. `color` is then the base its hues come from. */
  glowRecipe?: MeshRecipe;
  /** Draws the plain glow as a half-moon from BOTH the top and the bottom edge
   * (the Space cards' own look) instead of just the bottom one. Ignored when there
   * is a `glowRecipe`. */
  twinGlow?: boolean;
}

/**
 * A card in one accent color: a soft outline in that color, and a glow of it (the
 * plain half-moon from the bottom edge, or a mesh recipe), on `ink`. The card every
 * challenge and Space card is built on, so they read as one family. Padded `md` by
 * default — override it, and set the size, through `style`; children render on top
 * of the glow.
 *
 * The glow is a confirmed exception to "no gradients" (2026-09-20). Drop the
 * `<AccentGlow>` below to get the flat outlined card back.
 */
export function AccentCard({ color, glowRecipe, twinGlow = false, style, children, ...props }: AccentCardProps) {
  return (
    <View
      {...props}
      style={[styles.card, { borderColor: withAlpha(color, OUTLINE_OPACITY) }, style]}
    >
      <AccentGlow>
        {({ width, height }) =>
          glowRecipe ? (
            <AccentMesh width={width} height={height} color={color} recipe={glowRecipe} grainOpacity={MESH_GRAIN} />
          ) : twinGlow ? (
            <AccentTwinDome width={width} height={height} color={color} {...TWIN_DOME} />
          ) : (
            <AccentDome width={width} height={height} color={color} edge="bottom" {...DOME} />
          )
        }
      </AccentGlow>
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
