import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { AccentDome, ACCENT_VIVID_FACTOR } from './accentDome';
import { AccentGlow } from './accentGlow';
import { AccentMesh } from './accentMesh';
import { AccentTwinDome } from './accentTwinDome';
import { borderWidth, colors, radius, spacing } from '../../constants/theme';
import type { MeshRecipe } from '../../constants/meshRecipes';
import { boostSaturation, withAlpha } from '../../utils/color';

// A soft outline in the accent color (`borderWidth.fine`, at 30%) around a dark
// card, with a Skia glow behind the content: by default the same two-tone
// half-moon light as the Challenge-Info / progress backdrop (`AccentDome`), at
// card scale, raised from the bottom edge — 62% of the card's width at the edge,
// reaching 80% of the way up; no blur (cheap in a long list). Given a
// `glowRecipe`, the glow is that recipe's mesh instead (`AccentMesh`) — very
// large, multicolor fields that fade into the same `ink` — on the same
// outlined card.
//
// `washPeak`/`bloomPeak` bumped 2026-09-25, per explicit "I love what you did
// with the home screen gradient saturation/brightness, do it too to the mine
// and explore challenge cards, as well as the challenge card in home" — this
// `DOME` is what Home's hero card AND Mine's cards both use (Mine passes no
// `glowRecipe`, per its own explicit "give the mine cards the same gradient
// as the challenge cards in the home screen" — see meshRecipes.ts's `mine`
// layout comment), so bumping it here covers both in one place. Now matches
// `WelcomeGlowBackground`'s own `WASH_PEAK`/`BLOOM_PEAK`, the same reference
// point `constants/screenBackground.ts`'s `PAPER_GRADIENT`/`TINTED_GRADIENT`
// were just matched to — a deliberate reversal of the "kept subtle on
// purpose... never so strong that pastel activity colors and paper text stop
// pairing" tuning this comment used to describe. Shape (`domeHalfWidth`/
// `domeDepth`) untouched, same as those two — only brightness was asked for.
const OUTLINE_OPACITY = 0.3;
const DOME = {
  domeHalfWidth: 0.62,
  domeDepth: 0.8,
  washPeak: 0.39,
  bloomPeak: 0.26,
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
  /** Overrides individual numbers of the plain dome glow's own recipe (`DOME`)
   * for THIS card only — added for cards whose real aspect ratio is much
   * shorter/wider than the tall hero card `DOME` was tuned against, where the
   * same fractional `domeDepth` produces a much flatter, less rounded (and so
   * less "concentrated") dome (`AccentDome`'s own circle-through-three-points
   * math: a small `depthPx` relative to `halfWidthPx` pushes the radius way
   * up, flattening the curve). Also takes `AccentDome`'s newer per-instance
   * tightening/shaping/brightness knobs (`bloomRadius`/`falloffSharpness`/
   * `vividFactor`/`bloomSquashY`/`coreBoost`/`bloomBlur`, not part of the
   * shared `DOME` object — see that component's own prop docs). Ignored when
   * there's a `glowRecipe` or `twinGlow`. */
  domeOverride?: Partial<
    Record<
      keyof typeof DOME | 'bloomRadius' | 'falloffSharpness' | 'vividFactor' | 'bloomSquashY' | 'coreBoost' | 'bloomBlur',
      number
    >
  >;
  /** Draws the glow as a single flat diagonal `LinearGradient` — `ink` at
   * the top-left corner to the full, vivid accent color at the
   * bottom-right — instead of the dome/mesh/twin-dome. Added 2026-09-25 for
   * Space cards specifically, per an attached reference image ("I want
   * something like this, only gradient wise... with their activity
   * colors") after several rounds of trying to get there through the
   * dome/bloom system instead (see SpaceCardView.tsx's own history) — a
   * plain corner-to-corner gradient is a completely different, much
   * simpler shape (no radial falloff, no "circle" to be visible, no
   * bloom/wash to balance against each other) that matches what was
   * actually being asked for far more directly. Wins over `glowRecipe`/
   * `twinGlow`/`domeOverride` if more than one is somehow set (no current
   * caller does). Uses Skia's own `LinearGradient` (the same primitive
   * `AccentDome`'s wash already draws successfully) — NOT
   * `expo-linear-gradient`, which is confirmed to render nothing at all in
   * this app's actual build (see ChallengeCardShimmer.tsx's own doc
   * comment for that already-diagnosed bug). */
  linearGlow?: boolean;
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
export function AccentCard({
  color,
  glowRecipe,
  twinGlow = false,
  domeOverride,
  linearGlow = false,
  style,
  children,
  ...props
}: AccentCardProps) {
  return (
    <View
      {...props}
      style={[styles.card, { borderColor: withAlpha(color, OUTLINE_OPACITY) }, style]}
    >
      <AccentGlow>
        {({ width, height }) =>
          linearGlow ? (
            <Rect x={0} y={0} width={width} height={height}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(width, height)}
                colors={[colors.ink, boostSaturation(color, ACCENT_VIVID_FACTOR)]}
              />
            </Rect>
          ) : glowRecipe ? (
            <AccentMesh width={width} height={height} color={color} recipe={glowRecipe} grainOpacity={MESH_GRAIN} />
          ) : twinGlow ? (
            <AccentTwinDome width={width} height={height} color={color} {...TWIN_DOME} />
          ) : (
            <AccentDome width={width} height={height} color={color} edge="bottom" {...DOME} {...domeOverride} />
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
