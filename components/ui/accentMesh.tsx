import { Circle, FractalNoise, Group, LinearGradient, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { ACCENT_VIVID_FACTOR } from './accentDome';
import { colors } from '../../constants/theme';
import type { MeshBlob, MeshRecipe } from '../../constants/meshRecipes';
import { boostSaturation, rotateHue, withAlpha } from '../../utils/color';

// How a field (or the scrim, or the top fade) eases out, as [position from its
// core to its edge, share of its peak alpha]. A Gaussian bell — it starts fading
// straight away from the core and trails off in a long tail (about 43% of the way
// out it is still under half strength, and a tenth of it is left three quarters of
// the way) — so the color dissolves gradually into the dark instead of holding
// strong up to a boundary. (Softer than the dome's `SOFT_FALLOFF`, which is what
// the screens' backdrops use.)
export const MESH_FALLOFF: [number, number][] = [
  [0, 1],
  [0.1, 0.967],
  [0.2, 0.875],
  [0.3, 0.739],
  [0.4, 0.582],
  [0.5, 0.426],
  [0.6, 0.287],
  [0.7, 0.175],
  [0.8, 0.092],
  [0.9, 0.036],
  [1, 0],
];

interface AccentMeshProps {
  /** The size of the area the mesh is drawn in, in px. */
  width: number;
  height: number;
  /** The base color every hue in the recipe is derived from — the challenge's
   * activity color, or the rest / completed state's color. */
  color: string;
  /** What to draw — a recipe from `getMeshRecipe`. */
  recipe: MeshRecipe;
  /** Strength (alpha) of a fine film grain over the mesh, against banding. Leave
   * unset for none. */
  grainOpacity?: number;
}

// A unit circle placed like a field: scaled to its half-sizes (both of the card's
// width, so a field keeps its shape when rotated), rotated, then moved to its
// center. Drawn under this transform, the unit circle's radial gradient becomes
// the field's stretched, tilted soft edge.
function place(field: MeshBlob, width: number, height: number) {
  return [
    { translateX: field.x * width },
    { translateY: field.y * height },
    { rotate: (field.angle * Math.PI) / 180 },
    { scaleX: field.rx * width },
    { scaleY: field.ry * width },
  ];
}

/**
 * The challenge cards' "mesh" glow: a recipe's few very large, soft fields — each
 * the base color with its hue rotated — stretched and rotated and added together
 * so overlaps make in-between hues; then an eased scrim over the text side, an
 * optional fade from the top, and, optionally, a grain. The color is made exactly
 * the way `AccentDome`'s is (the same saturation boost on the same base) and is
 * dimmed only by its alpha over the card's `ink` — never by lowering its lightness,
 * which would deepen and over-saturate it — so the mesh has the same saturation as
 * the Challenge-Info / progress backdrop and Home's light. Everything darkens into
 * `ink`, so the color dissolves into the card. The same Skia pieces as
 * `AccentDome` (radial gradients, additive blending, dithered against banding),
 * and no blur filter, so it stays cheap in a long list. Static.
 *
 * Renders Skia nodes only, so it goes inside a `Canvas`, over the card's `ink` base.
 */
export function AccentMesh({ width, height, color, recipe, grainOpacity = 0 }: AccentMeshProps) {
  const { blobs, scrim, topFade } = recipe;
  const base = boostSaturation(color, ACCENT_VIVID_FACTOR);

  return (
    <>
      {/* `plus` (additive), like the backdrop's bloom: overlapping fields blend
          into in-between hues and only brighten. */}
      <Group blendMode="plus">
        {blobs.map((blob, index) => {
          const blobColor = rotateHue(base, blob.hue);
          return (
            <Group key={index} transform={place(blob, width, height)}>
              <Circle cx={0} cy={0} r={1} dither>
                <RadialGradient
                  c={vec(0, 0)}
                  r={1}
                  colors={MESH_FALLOFF.map(([, share]) => withAlpha(blobColor, blob.peak * share))}
                  positions={MESH_FALLOFF.map(([position]) => position)}
                />
              </Circle>
            </Group>
          );
        })}
      </Group>

      {/* The scrim eases in from the left edge the same way — not a straight
          two-stop ramp, which shows as a visible line where it ends. */}
      <Rect x={0} y={0} width={width} height={height} dither>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width * scrim.reach, 0)}
          colors={MESH_FALLOFF.map(([, share]) => withAlpha(colors.ink, scrim.peak * share))}
          positions={MESH_FALLOFF.map(([position]) => position)}
        />
      </Rect>

      {/* The top fade eases in from the top edge, so the gradient thins out
          gradually as it goes up instead of stopping. */}
      {topFade ? (
        <Rect x={0} y={0} width={width} height={height} dither>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height * topFade.reach)}
            colors={MESH_FALLOFF.map(([, share]) => withAlpha(colors.ink, topFade.peak * share))}
            positions={MESH_FALLOFF.map(([position]) => position)}
          />
        </Rect>
      ) : null}

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
