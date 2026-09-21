import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, glass } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

/** The glass rim (a hairline `paper` border) — spread it into a container's
 * style alongside `overflow: 'hidden'` and a radius. */
export const glassBorderStyle = {
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: withAlpha(colors.paper, glass.borderOpacity),
} as const;

interface GlassBackdropProps {
  /** How much of the `surface` tint sits over the blur. Default `glass.tintOpacity`;
   * a small badge over a colored light takes the lighter `glass.badgeTintOpacity`. */
  tintOpacity?: number;
}

/**
 * The blur + dark `surface` tint layers of the shared glass recipe (see
 * `glass` in the theme), absolutely filling whatever contains them. Use it as
 * the first child of a container that clips (`overflow: 'hidden'`) and has a
 * radius, or via `GlassSurface` below, which does all of that.
 */
export function GlassBackdrop({ tintOpacity = glass.tintOpacity }: GlassBackdropProps) {
  return (
    <>
      <BlurView intensity={glass.blurIntensity} tint={glass.tint} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.tint, { backgroundColor: withAlpha(colors.surface, tintOpacity) }]} />
    </>
  );
}

/** A frosted-glass container, same look as the bottom nav bar. Pass the radius
 * (and size/padding) through `style`. */
export function GlassSurface({ style, children, ...props }: ViewProps) {
  return (
    <View {...props} style={[styles.surface, style]}>
      <GlassBackdrop />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
    ...glassBorderStyle,
  },
  tint: {
    ...StyleSheet.absoluteFill,
  },
});
