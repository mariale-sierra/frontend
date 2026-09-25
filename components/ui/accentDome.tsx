import { Blur, FractalNoise, Group, LinearGradient, Oval, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { colors } from '../../constants/theme';
import { boostSaturation, lighten, rotateHue, withAlpha } from '../../utils/color';

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
  /** The bloom's own radius, as a share of `width` — leave unset for the
   * default (`BLOOM_RADIUS`, 0.6). Added 2026-09-25 for a caller that wants
   * a smaller, tighter, more concentrated bright core instead of the
   * default spread — see `falloffSharpness`'s own comment for the fuller
   * "too blurry/washed out" context this and it were both added for. */
  bloomRadius?: number;
  /** Raises the wash's (`DOME_PROFILE`) and bloom's (`SOFT_FALLOFF`) own
   * falloff curves to this power — leave unset (1) for the default curves,
   * unchanged. Added 2026-09-25, per explicit "too blurry, washed out, and
   * evenly blended... tighten the falloff... each shape should have a
   * clearly visible, saturated core before fading to transparent": raising
   * a share to a power > 1 leaves it nearly unchanged near the core
   * (share close to 1) but pulls it down much faster through the middle
   * distance, so the same geometric radius reads as a smaller, brighter,
   * more sharply-edged (while still smoothly-curved, never a hard cutoff)
   * shape instead of a long, gradual, "haze" that blends into whatever's
   * next to it. */
  falloffSharpness?: number;
  /** Overrides `ACCENT_VIVID_FACTOR` (1.25) for this instance's own
   * saturation boost — leave unset for the default. Added 2026-09-25
   * alongside `falloffSharpness`, for "increase the core's... saturation
   * and luminance" specifically. */
  vividFactor?: number;
  /** Squashes the bloom vertically (as a Y scale, anchored at the edge it's
   * drawn on) — leave unset (1) for the default, a true circle. Added
   * 2026-09-25, per explicit "it needs to be more ovaly, like a half moon":
   * the bloom is a `Circle` at heart (now an `Oval` so it can actually BE
   * squashed — a `Circle` can't), always perfectly round regardless of how
   * bright it gets, unlike the wash (whose own circle-through-three-points
   * geometry can already read as flatter/wider via `domeHalfWidth`/
   * `domeDepth`). Values < 1 flatten it into a shallow, wide half-moon arc
   * instead of a tall round dome; the same technique (an `Oval` sized to
   * the squash, its `RadialGradient` given a matching `origin`+`transform`
   * so the circular falloff maps onto the now-elliptical shape) already
   * used by `MeshGradientBackground`'s own fields. */
  bloomSquashY?: number;
  /** Lightens the bloom's own core toward white, fading back to the pure
   * accent color by `CORE_LIGHTEN_REACH` of the way to the rim — leave
   * unset (0, no lightening) for the default, where the core is just the
   * accent color at full alpha. Added 2026-09-25, per explicit "there is
   * still no light or brightness in the pit of the circle of the
   * gradient": a real light source's own center reads near-white-hot, with
   * its color showing in the halo around it, not at the core itself —
   * raising `bloomPeak` alone can only push the accent color's OWN alpha
   * higher, never past what that color already looks like at full opacity,
   * so it can't produce this on its own. */
  coreBoost?: number;
}

// How far toward the rim (as a fraction of the bloom's own falloff, 0 =
// core, 1 = rim) `coreBoost`'s lightening reaches before fading back to the
// pure accent color — keeps the "hot" white-ish tint confined to a small
// point at the very center, not smeared across the whole bloom.
const CORE_LIGHTEN_REACH = 0.35;

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
 * wash's own circle is defined by the two things that matter to how it looks —
 * its width at its edge and how far it reaches in — and the circle through
 * those three points is what's drawn: a true circle by default, though a wide
 * `domeHalfWidth` relative to `domeDepth` already reads flatter/wider. The
 * bloom is its own separate shape and can be squashed independently via
 * `bloomSquashY`, into a half-moon rather than perfectly round.
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
  bloomRadius: bloomRadiusShare = BLOOM_RADIUS,
  falloffSharpness = 1,
  vividFactor = ACCENT_VIVID_FACTOR,
  bloomSquashY = 1,
  coreBoost = 0,
}: AccentDomeProps) {
  const accent = boostSaturation(color, vividFactor);
  const tones = TONE_STEPS.map((step) => rotateHue(accent, step * HUE_SPREAD));
  // Raising a share to a power > 1 leaves it close to its own value near 1
  // (the core) but pulls it down much faster through the middle distance —
  // see `falloffSharpness`'s own prop doc. `=== 1` skips the (harmless but
  // pointless) `Math.pow` call for every other caller, which never sets this.
  const sharpen = (curve: [number, number][]) =>
    falloffSharpness === 1 ? curve : curve.map(([position, share]): [number, number] => [position, share ** falloffSharpness]);
  const washProfile = sharpen(DOME_PROFILE);
  const bloomFalloff = sharpen(SOFT_FALLOFF);
  // Lightens toward white near position 0 (the core), linearly back down to
  // 0 extra lightening by `CORE_LIGHTEN_REACH` — see `coreBoost`'s own prop
  // doc. `=== 0` skips it entirely for every other caller, which never sets
  // this (untouched default look).
  const bloomColor = (position: number) =>
    coreBoost === 0 ? accent : lighten(accent, coreBoost * Math.max(0, 1 - position / CORE_LIGHTEN_REACH));

  const cx = width / 2;
  // The circle through (cx ± halfWidth, on the edge) and (cx, depth in from it).
  const halfWidthPx = width * domeHalfWidth;
  const depthPx = height * domeDepth;
  const radius = (halfWidthPx ** 2 + depthPx ** 2) / (2 * depthPx);
  const centerY = edge === 'top' ? depthPx - radius : height - depthPx + radius;
  const edgeY = edge === 'top' ? 0 : height;

  const bloomRadius = width * bloomRadiusShare;

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
            colors={washProfile.map(([, share]) => withAlpha(colors.ink, share * washPeak))}
            positions={washProfile.map(([position]) => position)}
          />
        </Rect>
      </Group>

      <Group blendMode="plus">
        {bloomBlur > 0 ? <Blur blur={bloomBlur} mode="clamp" /> : null}
        <Oval
          x={cx - bloomRadius}
          y={edgeY - bloomRadius * bloomSquashY}
          width={bloomRadius * 2}
          height={bloomRadius * 2 * bloomSquashY}
          dither
        >
          <RadialGradient
            c={vec(cx, edgeY)}
            r={bloomRadius}
            origin={vec(cx, edgeY)}
            transform={[{ scaleY: bloomSquashY }]}
            colors={bloomFalloff.map(([position, share]) => withAlpha(bloomColor(position), bloomPeak * share))}
            positions={bloomFalloff.map(([position]) => position)}
          />
        </Oval>
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
