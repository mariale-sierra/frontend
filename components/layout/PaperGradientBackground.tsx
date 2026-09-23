import { StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { AccentDome } from '../ui/accentDome';
import { WebSafeCanvas } from '../ui/webSafeCanvas';
import { colors } from '../../constants/theme';
import { PAPER_GRADIENT, PAPER_GRADIENT_EDGE, TINTED_GRADIENT } from '../../constants/screenBackground';

// A fine film grain over the light, on top of the dome's dither, against banding:
// a slow fade from a near-black to a slightly lighter gray has only a few dozen
// 8-bit steps to fall through, and a colorless light shows each one as a ring more
// than a colored one does (the first version, with the grain at 0.02 and no dither,
// showed them on Search, Challenges and Profile). Kept small: the grain also lifts
// the black a hair wherever there is no light.
const GRAIN_OPACITY = 0.03;

// The bloom's blur, as a share of the screen's width — enough to keep its focal
// point soft.
const BLOOM_BLUR = 0.04;

interface PaperGradientBackgroundProps {
  /** The edge the light comes from: `top` or `bottom` (upside down). Default
   * `PAPER_GRADIENT_EDGE`. */
  edge?: 'top' | 'bottom';
  /** Colors the light (an activity color) instead of `paper`. A tinted light is a
   * little stronger (`TINTED_GRADIENT`). */
  tint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The simple screen background: a subtle spotlight of `paper` — or of a `tint` —
 * the same half-moon light as the Challenge-Info backdrop (`AccentDome`),
 * strongest at the middle of its edge and fading out round its rim into the dark
 * (`PAPER_GRADIENT`), so it reads as a light shining in from that edge rather than
 * a fade across the whole screen. Opt-in per screen via `ScreenBackground`'s
 * `gradientBackground` prop, in place of the mesh gradient while
 * `USE_PAPER_GRADIENT_BACKGROUND` is on.
 *
 * Only the light: it draws over whatever is behind it (`ScreenBackground`'s `ink`),
 * so lights of different colors can be stacked and cross-faded
 * (`PagedGradientBackground`).
 */
export function PaperGradientBackground({ edge = PAPER_GRADIENT_EDGE, tint, style }: PaperGradientBackgroundProps) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <WebSafeCanvas style={StyleSheet.absoluteFill}>
        <AccentDome
          width={width}
          height={height}
          color={tint ?? colors.paper}
          edge={edge}
          {...(tint ? TINTED_GRADIENT : PAPER_GRADIENT)}
          bloomBlur={width * BLOOM_BLUR}
          grainOpacity={GRAIN_OPACITY}
        />
      </WebSafeCanvas>
    </View>
  );
}
