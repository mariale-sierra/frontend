import { StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Blur, Fill, FractalNoise, Group, Oval, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { AccentDome } from '../ui/accentDome';
import { RainbowGradientBackground } from './RainbowGradientBackground';
import { WebSafeCanvas } from '../ui/webSafeCanvas';
import { activityColors, colors } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

// The `soft` look: quiet enough to sit behind the colored cards — the six fields at
// under half the strength the original had, over a faint `paper` light from the top
// (an `AccentDome`, colorless — the depth the plain paper background gave) so the
// screen still has depth where the colors thin out.
const SOFT_LOOK = {
  fieldPeakOpacity: 0.055,
  paperLight: { domeHalfWidth: 0.7, domeDepth: 0.4, washPeak: 0.04, bloomPeak: 0.02 },
} as const;

/** `vivid` is the animated rainbow (`RainbowGradientBackground`) — the original
 * static vivid mesh was freshened and made to move on 2026-09-20 (explicit
 * request), so it no longer exists in its old form. `soft` is the quiet static
 * mesh behind the colored cards. */
export type MeshGradientLook = 'vivid' | 'soft';

// The fields sit on a half-moon arc hanging from the top edge: the ends rise
// to the corners and the middle dips lowest. Arc radius is a fraction of screen
// WIDTH; the arc's center sits at ARC_CENTER_Y (fraction of height).
const ARC_RADIUS = 0.42;
const ARC_CENTER_Y = 0;
const FIELD_RADIUS = 0.3; // fraction of screen width

// Each field is stretched taller than wide so its color bleeds down the
// screen instead of ending in a round edge.
const FIELD_STRETCH_Y = 1.8;

// Falloff as [position along the radius, share of peak opacity]. Many gentle
// stops (roughly gaussian) so the color eases out instead of having a visible
// kink where a plateau meets the fade.
const FALLOFF: [number, number][] = [
  [0, 1],
  [0.25, 0.9],
  [0.5, 0.55],
  [0.75, 0.2],
  [1, 0],
];

// One field per activity color, and only activity colors. Ordered by hue left
// to right (magenta wraps around into gold) so neighbors overlap into natural
// in-between tones — overlapping far-apart hues additively is what summed to
// gray before. `angle` is degrees along the arc: 180 = far left, 0 = far right.
const MESH_FIELDS = [
  { color: activityColors.mindBody, angle: 168 }, // magenta
  { color: activityColors.strength, angle: 136.8 }, // gold
  { color: activityColors.cardioIntense, angle: 105.6 }, // lime
  { color: activityColors.cardioLow, angle: 74.4 }, // aqua
  { color: activityColors.functional, angle: 43.2 }, // sky blue
  { color: activityColors.flexibility, angle: 12 }, // blue
];

interface MeshGradientBackgroundProps {
  style?: StyleProp<ViewStyle>;
  /** `vivid` (the animated rainbow) or `soft` — see `MeshGradientLook`. Default `vivid`. */
  look?: MeshGradientLook;
  unmountOnBlur?: boolean;
}

/**
 * The mesh gradient backgrounds, opt-in per screen via `ScreenBackground`'s
 * `gradientBackground` prop — but only while `USE_PAPER_GRADIENT_BACKGROUND` is off
 * (the screens get the simple `PaperGradientBackground` otherwise; which look it
 * gets is decided by `USE_VIVID_MESH_BACKGROUND`). The one exception is the
 * create-challenge flow, which asks for the `vivid` look outright (`vividGradient`,
 * `USE_VIVID_CREATE_FLOW_BACKGROUND`).
 */
export function MeshGradientBackground({ style, look = 'vivid', unmountOnBlur = false }: MeshGradientBackgroundProps) {
  return look === 'vivid' ? (
    <RainbowGradientBackground style={style} unmountOnBlur={unmountOnBlur} />
  ) : (
    <SoftMeshBackground style={style} unmountOnBlur={unmountOnBlur} />
  );
}

/**
 * "Atmospheric mesh gradient" background, `soft` look — six feathered fields, one
 * per activity color, arranged on a half-moon arc hanging from the top of the
 * screen. Blended additively so neighboring fields read as continuous
 * intermediate hues, each stretched downward and eased out so the color
 * blends softly toward the bottom, then vignetted to solid `colors.ink` with
 * a very faint grain layer.
 */
function SoftMeshBackground({ style, unmountOnBlur = false }: { style?: StyleProp<ViewStyle>; unmountOnBlur?: boolean }) {
  const { width, height } = useWindowDimensions();
  const { fieldPeakOpacity, paperLight } = SOFT_LOOK;

  const fields = MESH_FIELDS.map((field) => {
    const radians = (field.angle * Math.PI) / 180;
    return {
      color: field.color,
      cx: width * (0.5 + ARC_RADIUS * Math.cos(radians)),
      cy: height * ARC_CENTER_Y + width * ARC_RADIUS * Math.sin(radians),
      r: width * FIELD_RADIUS,
    };
  });

  const vignetteCx = width * 0.5;
  const vignetteCy = height * 0.08;
  const vignetteRadius = height * 1.15;

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <WebSafeCanvas style={StyleSheet.absoluteFill} unmountOnBlur={unmountOnBlur}>
        <Fill color={colors.ink} />

        <AccentDome
          width={width}
          height={height}
          color={colors.paper}
          domeHalfWidth={paperLight.domeHalfWidth}
          domeDepth={paperLight.domeDepth}
          washPeak={paperLight.washPeak}
          bloomPeak={paperLight.bloomPeak}
          bloomBlur={width * 0.04}
        />

        {/* `plus` (additive), not `screen` — screen washes low-opacity colors
            toward gray/pastel over a dark base; additive keeps each field's
            real hue/saturation and only lowers brightness. */}
        <Group blendMode="plus">
          {/* Light blur — a heavy one spreads low-opacity color thin and
              reads as diluted rather than a concentrated, deep patch. */}
          <Blur blur={width * 0.035} mode="clamp" />
          {fields.map((field, index) => (
            <Oval
              key={index}
              x={field.cx - field.r}
              y={field.cy - field.r * FIELD_STRETCH_Y}
              width={field.r * 2}
              height={field.r * 2 * FIELD_STRETCH_Y}
            >
              <RadialGradient
                c={vec(field.cx, field.cy)}
                r={field.r}
                origin={vec(field.cx, field.cy)}
                transform={[{ scaleY: FIELD_STRETCH_Y }]}
                colors={FALLOFF.map(([, share]) => withAlpha(field.color, fieldPeakOpacity * share))}
                positions={FALLOFF.map(([position]) => position)}
              />
            </Oval>
          ))}
        </Group>

        {/* Long, gentle fade to ink so the colors thin out gradually down the
            screen rather than stopping at a defined edge. */}
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(vignetteCx, vignetteCy)}
            r={vignetteRadius}
            colors={[withAlpha(colors.ink, 0), withAlpha(colors.ink, 0.15), withAlpha(colors.ink, 0.5), colors.ink]}
            positions={[0.1, 0.4, 0.7, 1]}
          />
        </Rect>

        {/* Subtle grain — meant to be felt more than seen. */}
        <Group opacity={0.02} blendMode="overlay">
          <Rect x={0} y={0} width={width} height={height}>
            <FractalNoise freqX={0.9} freqY={0.9} octaves={4} seed={7} tileWidth={width} tileHeight={height} />
          </Rect>
        </Group>
      </WebSafeCanvas>
    </View>
  );
}
