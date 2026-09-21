import { Blur, Circle, FractalNoise, Group, LinearGradient, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { colors } from '../../constants/theme';
import { boostSaturation, rotateHue, withAlpha } from '../../utils/color';

// A touch more saturated than the (intentionally muted) activity token, so
// the light reads as colored light instead of a gray wash.
export const ACCENT_VIVID_FACTOR = 1.25;

// How far, in degrees of hue, the two sides of the wash drift from the accent —
// enough for a visible two-tone shift, close enough to stay one color family.
const HUE_SPREAD = 22;

// The wash's hue ramps evenly from warmer on the left to cooler on the right
// through these steps (as a fraction of HUE_SPREAD). Many small steps instead
// of "warm, accent, cool" because a single accent midpoint makes the color
// change direction exactly at the center, which shows up as a faint vertical
// seam.
const TONE_STEPS = [1, 2 / 3, 1 / 3, 0, -1 / 3, -2 / 3, -1];

// How strong the wash is by distance from the circle's center, as [position out
// to the rim (0 = center, 1 = rim), share of full strength]. From the strong
// core it drops away decisively toward the rim. One smooth curve — the dome's
// shape comes from where it finishes, not from any line.
const DOME_PROFILE: [number, number][] = [
  [0, 1],
  [0.36, 0.92],
  [0.5, 0.68],
  [0.65, 0.42],
  [0.8, 0.18],
  [0.92, 0.06],
  [1, 0],
];

// Radial falloff for the bloom — and for the mesh's blobs (`AccentMesh`), so all
// the accent light eases out the same way.
export const SOFT_FALLOFF: [number, number][] = [
  [0, 1],
  [0.25, 0.9],
  [0.5, 0.55],
  [0.75, 0.2],
  [1, 0],
];

// The bloom is as wide as this share of the area's width.
const BLOOM_RADIUS = 0.6;

interface AccentDomeProps {
  /** The size of the area the light is drawn in, in px. */
  width: number;
  height: number;
  /** The accent color the light is made of. */
  color: string;
  /** The edge the half-moon is cut off by: `top` hangs it from the top edge (a
   * screen's backdrop), `bottom` raises it from the bottom edge (a card's glow).
   * Default `top`. */
  edge?: 'top' | 'bottom';
  /** How wide the half-moon is where it meets its edge, as a fraction of `width`
   * (above 0.5 it runs off the sides there). */
  domeHalfWidth: number;
  /** How far in from its edge the half-moon reaches at its furthest point, as a
   * fraction of `height`. */
  domeDepth: number;
  /** Strength (alpha) of the wash and of the bloom at their strongest. */
  washPeak: number;
  bloomPeak: number;
  /** Blur radius, in px, softening the bloom. Leave unset for none (cheaper,
   * for lists). */
  bloomBlur?: number;
  /** Strength (alpha) of a fine film grain over the light, against banding.
   * Leave unset for none. */
  grainOpacity?: number;
}

/**
 * The accent "light" behind a challenge — one recipe shared by the
 * Challenge-Info / progress / members / routine backdrop
 * (`ChallengeAccentBackdrop`, a whole screen, hung from its top edge), the
 * background gradient's paper light (`MeshGradientBackground`) and the glow
 * cards' glow (`AccentGlow`, from a card's bottom or top edge): a two-tone wash
 * (the accent, drifting warmer on the left and cooler on the right) shaped like a
 * half-moon — a large circle cut off by an edge — strongest at that edge and
 * fading out along a round rim, one soft bloom on the edge's center as its focal
 * point, and, optionally, a faint grain. The gradients are DITHERED: a light
 * this quiet only has a few dozen 8-bit steps to fall through, and undithered each
 * step shows as a ring.
 *
 * Renders Skia nodes only, so it goes inside a `Canvas`, over whatever base
 * (`ink`, `surface`) the caller draws first. Rather than a raw radius, the
 * circle is defined by the two things that matter to how it looks — its width at
 * its edge and how far it reaches in — and the circle through those three points
 * is what's drawn: a true circle, so it reads as round, not oval.
 */
export function AccentDome({
  width,
  height,
  color,
  edge = 'top',
  domeHalfWidth,
  domeDepth,
  washPeak,
  bloomPeak,
  bloomBlur = 0,
  grainOpacity = 0,
}: AccentDomeProps) {
  const accent = boostSaturation(color, ACCENT_VIVID_FACTOR);
  const tones = TONE_STEPS.map((step) => rotateHue(accent, step * HUE_SPREAD));

  const cx = width / 2;
  // The circle through (cx ± halfWidth, on the edge) and (cx, depth in from it).
  const halfWidthPx = width * domeHalfWidth;
  const depthPx = height * domeDepth;
  const radius = (halfWidthPx ** 2 + depthPx ** 2) / (2 * depthPx);
  const centerY = edge === 'top' ? depthPx - radius : height - depthPx + radius;
  const edgeY = edge === 'top' ? 0 : height;

  const bloomRadius = width * BLOOM_RADIUS;

  return (
    <>
      {/* Own layer, so the `dstIn` shaping below only affects the wash. */}
      <Group layer>
        {/* Full-size rectangles, so the wash has no edge of its own — its
            outline comes only from the fade below. */}
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={tones} />
        </Rect>
        <Rect x={0} y={0} width={width} height={height} blendMode="dstIn" dither>
          <RadialGradient
            c={vec(cx, centerY)}
            r={radius}
            colors={DOME_PROFILE.map(([, share]) => withAlpha(colors.ink, share * washPeak))}
            positions={DOME_PROFILE.map(([position]) => position)}
          />
        </Rect>
      </Group>

      <Group blendMode="plus">
        {bloomBlur > 0 ? <Blur blur={bloomBlur} mode="clamp" /> : null}
        <Circle cx={cx} cy={edgeY} r={bloomRadius} dither>
          <RadialGradient
            c={vec(cx, edgeY)}
            r={bloomRadius}
            colors={SOFT_FALLOFF.map(([, share]) => withAlpha(accent, bloomPeak * share))}
            positions={SOFT_FALLOFF.map(([position]) => position)}
          />
        </Circle>
      </Group>

      {grainOpacity > 0 ? (
        <Group opacity={grainOpacity} blendMode="overlay">
          <Rect x={0} y={0} width={width} height={height}>
            <FractalNoise freqX={0.9} freqY={0.9} octaves={4} seed={7} tileWidth={width} tileHeight={height} />
          </Rect>
        </Group>
      ) : null}
    </>
  );
}
