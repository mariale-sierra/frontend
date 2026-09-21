import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { borderWidth, colors, glass } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

/** The glass rim (a hairline `paper` border) — spread it into a container's
 * style alongside `overflow: 'hidden'` and a radius. */
export const glassBorderStyle = {
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: withAlpha(colors.paper, glass.borderOpacity),
} as const;

/** What a container with the highlight's gradient rim (`GlassHighlight`) takes in place of
 * `glassBorderStyle`: the gradient rim is the outline, so the plain hairline goes. */
export const glassRimmedStyle = {
  borderWidth: 0,
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

// The rim is drawn as a stroke twice as wide as it shows: it is centered on the
// container's own edge, so its outer half falls outside the container, where the clip
// cuts it off, and the inner half is the rim.
const RIM_STROKE = borderWidth.thin * 2;

// A sheet's rim is lit along its top edge and fades down its sides over this share of the
// rectangle it is drawn in (which is twice the sheet's height: see `GlassHighlight`).
const SHEET_RIM_FADE = 0.12;

// The rim's gradient, as [offset, opacity] stops — bright at the start, dim after — and the
// direction it runs: a card's from its top-left corner to its bottom-right, a sheet's down.
const RIM = {
  card: {
    end: { x2: '1', y2: '1' },
    stops: [
      [0, glass.rimOpacity.bright],
      [0.5, glass.rimOpacity.dim],
      [1, glass.rimOpacity.echo],
    ],
  },
  sheet: {
    end: { x2: '0', y2: '1' },
    stops: [
      [0, glass.rimOpacity.bright],
      [SHEET_RIM_FADE, glass.rimOpacity.dim],
    ],
  },
} as const;

// The rectangle a sheet's rim is drawn in, as a multiple of the sheet's height: taller than
// the sheet, so its bottom edge and corners fall outside it, under the clip.
const SHEET_RIM_HEIGHT_SHARE = 2;

interface GlassHighlightProps {
  /** The corner radius of the container the light is in, which the rim follows (a sheet's
   * top corners). */
  cornerRadius: number;
  /** `card` (default): a floating popup or toast — a soft sheen from the top-left corner
   * and a rim that is bright there, faint through the middle and echoes at the bottom-right.
   * `sheet`: a bottom sheet, anchored to the bottom of the screen — just the rim, lit along
   * its whole top edge and fading down its sides, with no bottom edge or corners. */
  kind?: 'card' | 'sheet';
}

/**
 * The extra light of a popup, a toast or a glass sheet, over the glass: a gradient rim and,
 * on a `card`, a soft `paper` sheen. Fills its container, which has to clip
 * (`overflow: 'hidden'`) and give its radius; put it after `GlassBackdrop`, before the
 * content, and give the container `glassRimmedStyle` in place of its hairline. See `glass` in
 * the theme for the strengths.
 *
 * The `Svg` is sized by its insets (`absoluteFill`) and deliberately NOT given `width` /
 * `height` props: those become a `'100%'` size in its style, and React Native measures
 * that against an absolute child's container WITHOUT its padding, so on a padded card
 * (the popup's) the rim came out smaller than the card, pinned to its top-left. The
 * insets are measured against the whole container, like the blur and tint under it.
 *
 * The rim's radius is clamped to half of its shorter side once it is measured. A view
 * whose `borderRadius` is bigger than that (the toast's, on its short bar) is clipped to a
 * circle of half its height, but an SVG rect clamps its `rx` to half its width and its `ry`
 * to half its height SEPARATELY: it drew an ellipse there, stretched along the bar and off
 * the clip — the outline "outstretched".
 */
export function GlassHighlight({ cornerRadius, kind = 'card' }: GlassHighlightProps) {
  const isSheet = kind === 'sheet';
  const rim = RIM[kind];
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) => (previous?.width === width && previous.height === height ? previous : { width, height }));
  }, []);

  const rimHeight = size ? size.height * (isSheet ? SHEET_RIM_HEIGHT_SHARE : 1) : 0;
  const rimRadius = size ? Math.min(cornerRadius, size.width / 2, rimHeight / 2) : cornerRadius;

  return (
    <Svg testID="glass-highlight" pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={handleLayout}>
      <Defs>
        {!isSheet ? (
          <LinearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="1">
            <Stop offset={0} stopColor={colors.paper} stopOpacity={glass.sheenOpacity} />
            <Stop offset={0.6} stopColor={colors.paper} stopOpacity={0} />
          </LinearGradient>
        ) : null}
        <LinearGradient id="glassRim" x1="0" y1="0" {...rim.end}>
          {rim.stops.map(([offset, opacity]) => (
            <Stop key={offset} offset={offset} stopColor={colors.paper} stopOpacity={opacity} />
          ))}
        </LinearGradient>
      </Defs>
      {!isSheet ? <Rect width="100%" height="100%" fill="url(#glassSheen)" /> : null}
      <Rect
        width="100%"
        height={isSheet ? `${SHEET_RIM_HEIGHT_SHARE * 100}%` : '100%'}
        rx={rimRadius}
        ry={rimRadius}
        fill="none"
        stroke="url(#glassRim)"
        strokeWidth={RIM_STROKE}
      />
    </Svg>
  );
}

interface GlassSurfaceProps extends ViewProps {
  /** Adds the light of the popups and toasts (`GlassHighlight`): a sheen over the glass
   * and a gradient rim in place of the plain hairline, following the `borderRadius`
   * given in `style`. */
  highlight?: boolean;
}

/** A frosted-glass container, same look as the bottom nav bar. Pass the radius
 * (and size/padding) through `style`. */
export function GlassSurface({ style, children, highlight = false, ...props }: GlassSurfaceProps) {
  const radius = StyleSheet.flatten(style)?.borderRadius;

  return (
    <View {...props} style={[styles.surface, highlight && glassRimmedStyle, style]}>
      <GlassBackdrop />
      {highlight ? <GlassHighlight cornerRadius={typeof radius === 'number' ? radius : 0} /> : null}
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
