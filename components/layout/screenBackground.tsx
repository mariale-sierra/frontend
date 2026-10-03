import { ReactNode } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewProps, ViewStyle, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../constants/theme';
import {
  PAPER_GRADIENT_EDGE,
  USE_PAPER_GRADIENT_BACKGROUND,
  USE_VIVID_MESH_BACKGROUND,
} from '../../constants/screenBackground';
import { MeshGradientBackground } from './MeshGradientBackground';
import { PagedGradientBackground } from './PagedGradientBackground';
import type { GradientPages } from './PagedGradientBackground';
import { PaperGradientBackground } from './PaperGradientBackground';

// `variant` used to pick between several LinearGradient treatments (default/
// top/activity/challenges). Gradients-as-surface-fills are a rejected
// pattern in the design system (see havit-design-system-SKILL.md →
// Explicitly Rejected Patterns), and per-activity coloring is retired too,
// so every variant still renders the same base — just now with two soft
// `react-native-svg` radial glows behind it. This is the one confirmed
// exception to "no gradients" in the whole app — a single shared background
// treatment, not a per-component decoration — see the skill's Explicitly
// Rejected Patterns section. The prop itself is kept inert purely so the
// ~25 screens that already pass it don't need editing.
type ScreenBackgroundVariant = 'default' | 'top' | 'activity' | 'challenges';

interface ScreenBackgroundProps extends ViewProps {
  children: ReactNode;
  variant?: ScreenBackgroundVariant;
  contentStyle?: StyleProp<ViewStyle>;
  applyTopInset?: boolean;
  /** Swaps the default two-glow SVG background for the gradient background: the
   * simple paper light (`PaperGradientBackground`), or, while
   * `USE_PAPER_GRADIENT_BACKGROUND` is off, the Skia mesh gradient
   * (`MeshGradientBackground`) — its `soft` look, or the original `vivid` one
   * while `USE_VIVID_MESH_BACKGROUND` is on. Opt-in: only the
   * Home/Search/Challenges/Profile tabs and the create-challenge flow use it. */
  gradientBackground?: boolean;
  /** The edge the paper light comes from (`PAPER_GRADIENT_EDGE` by default: the
   * `bottom`, upside down). Only the paper gradient has one. */
  gradientEdge?: 'top' | 'bottom';
  /** Colors the paper light after the current page of a carousel on the screen,
   * following its scroll (Home's challenge cards), instead of `paper`. Only the
   * paper gradient has it; without pages, or with none, the light is plain paper. */
  gradientPages?: GradientPages;
  /** The scroll offset of the screen's main list. Given, the gradient is anchored
   * to the top of the page: it scrolls up with the list and away, instead of
   * staying fixed behind it (Home's feed). Pulling the list down past its top
   * doesn't move it. Leave unset for a background that stays put. */
  gradientScrollY?: Animated.Value;
  /** Draws the original vivid rainbow mesh gradient (`MeshGradientBackground`'s
   * `vivid` look) as the gradient background, whatever the app-wide switches say.
   * Only the create-challenge flow asks for it (`USE_VIVID_CREATE_FLOW_BACKGROUND`);
   * the rest of the gradient screens keep the paper light. Needs
   * `gradientBackground`. */
  vividGradient?: boolean;
}

// The gradient background in use: the paper light (in a carousel's colors when the
// screen has pages), or, while `USE_PAPER_GRADIENT_BACKGROUND` is off, the mesh.
function Gradient({
  edge,
  pages,
  vivid,
}: {
  edge: 'top' | 'bottom';
  pages?: GradientPages;
  vivid: boolean;
}) {
  if (vivid) {
    return <MeshGradientBackground look="vivid" unmountOnBlur />;
  }
  if (!USE_PAPER_GRADIENT_BACKGROUND) {
    return <MeshGradientBackground look={USE_VIVID_MESH_BACKGROUND ? 'vivid' : 'soft'} unmountOnBlur />;
  }
  return pages && pages.colors.length > 0 ? (
    <PagedGradientBackground {...pages} edge={edge} unmountOnBlur />
  ) : (
    <PaperGradientBackground edge={edge} unmountOnBlur />
  );
}

// Carries the gradient up with a list's scroll: a screen's height of scrolling
// takes it a screen's height up, which is all of it. It stays put when pulled down.
function ScrollingBackdrop({ scrollY, children }: { scrollY?: Animated.Value; children: ReactNode }) {
  const { height } = useWindowDimensions();

  if (!scrollY) {
    return <>{children}</>;
  }

  const translateY = scrollY.interpolate({ inputRange: [0, height], outputRange: [0, -height], extrapolate: 'clamp' });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]} pointerEvents="none">
      {children}
    </Animated.View>
  );
}

export default function ScreenBackground({
  children,
  variant: _variant = 'default',
  style,
  contentStyle,
  applyTopInset = true,
  gradientBackground = false,
  gradientEdge = PAPER_GRADIENT_EDGE,
  gradientPages,
  gradientScrollY,
  vividGradient = false,
  ...props
}: ScreenBackgroundProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, style]} {...props}>
      {gradientBackground ? (
        <ScrollingBackdrop scrollY={gradientScrollY}>
          <Gradient edge={gradientEdge} pages={gradientPages} vivid={vividGradient} />
        </ScrollingBackdrop>
      ) : (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="glowPrimary" cx="15%" cy="0%" r="85%">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.05} />
                <Stop offset="55%" stopColor={colors.primary} stopOpacity={0.025} />
                <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="glowRest" cx="85%" cy="8%" r="80%">
                <Stop offset="0%" stopColor={colors.rest} stopOpacity={0.045} />
                <Stop offset="55%" stopColor={colors.rest} stopOpacity={0.023} />
                <Stop offset="100%" stopColor={colors.rest} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#glowPrimary)" />
            <Rect width="100%" height="100%" fill="url(#glowRest)" />
          </Svg>
        </View>
      )}

      <View
        style={[styles.content, applyTopInset && { paddingTop: insets.top }, contentStyle]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    flex: 1,
  },
});
