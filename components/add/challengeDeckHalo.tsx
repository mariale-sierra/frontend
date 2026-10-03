import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Circle, Group, RadialGradient, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { ACCENT_VIVID_FACTOR } from '../ui/accentDome';
import { MESH_FALLOFF } from '../ui/accentMesh';
import { DECK_HALO_PEAK } from '../../constants/challengeDeck';
import { boostSaturation, withAlpha } from '../../utils/color';
import { deckHaloOpacity } from '../../utils/challengeDeck';
import { WebSafeCanvas } from '../ui/webSafeCanvas';

interface ChallengeDeckHaloProps {
  /** One color per card of the deck, in its order: the card's activity color. */
  colors: string[];
  /** Which card is in front, continuously (see `ChallengeDeck`). */
  progress: SharedValue<number>;
  /** The circle's radius, in px. */
  radius: number;
  /** Where the circle sits (`left` / `top`, relative to the container it is put in). */
  style?: StyleProp<ViewStyle>;
}

interface HaloDiscProps {
  color: string;
  index: number;
  progress: SharedValue<number>;
  radius: number;
}

// One disc: the color at `DECK_HALO_PEAK` at the middle, easing out to nothing at the
// rim along the same long Gaussian-like fall-off as the mesh cards (no visible edge),
// dithered against banding. It is as strong as its card is close to the front.
function HaloDisc({ color, index, progress, radius }: HaloDiscProps) {
  const opacity = useDerivedValue(() => deckHaloOpacity(index - progress.value));
  const accent = boostSaturation(color, ACCENT_VIVID_FACTOR);

  return (
    <Group opacity={opacity}>
      <Circle cx={radius} cy={radius} r={radius} dither>
        <RadialGradient
          c={vec(radius, radius)}
          r={radius}
          colors={MESH_FALLOFF.map(([, share]) => withAlpha(accent, DECK_HALO_PEAK * share))}
          positions={MESH_FALLOFF.map(([position]) => position)}
        />
      </Circle>
    </Group>
  );
}

/**
 * The soft circle of light behind the log picker's deck, in the activity color of
 * the card in front — the way Home's background light takes the color of the
 * challenge card in its carousel. Every card has its own disc, stacked, and each
 * shows as much as its card is near the front, so dragging the deck cross-fades the
 * light from one card's color to the next's on the UI thread, with the cards.
 * It takes no touches.
 */
export function ChallengeDeckHalo({ colors, progress, radius, style }: ChallengeDeckHaloProps) {
  const diameter = radius * 2;

  return (
    <View pointerEvents="none" style={[styles.halo, { width: diameter, height: diameter }, style]}>
      <WebSafeCanvas style={StyleSheet.absoluteFill}>
        {colors.map((color, index) => (
          <HaloDisc key={`${index}-${color}`} color={color} index={index} progress={progress} radius={radius} />
        ))}
      </WebSafeCanvas>
    </View>
  );
}

const styles = StyleSheet.create({
  // Behind the cards by where it is put in the tree (before them), not by a z-index.
  halo: {
    position: 'absolute',
  },
});
