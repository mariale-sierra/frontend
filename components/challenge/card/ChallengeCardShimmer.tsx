import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, radius } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

// Widened and brightened 2026-09-22 — the first pass ("a soft diagonal
// band... 22%... every ~3.5s, pausing between passes") read as "almost
// invisible." Per the explicit follow-up ("like a skeleton loader"), this is
// a continuous, seamless sweep with no pause between passes.
const SWEEP_WIDTH = 150;
const SWEEP_PASS_MS = 1300;
const BAND_OVERHANG = 60;

// A soft-edged look built from three plain, flat-color `View`s of decreasing
// width and increasing opacity, all centered on the same line — the widest
// and dimmest outermost, the narrowest and brightest at the core — instead
// of a real gradient. See the component's own doc comment for why: two
// earlier attempts at an actual gradient (`expo-linear-gradient`, then
// `@shopify/react-native-skia`) both rendered NOTHING at all. A flat
// `backgroundColor` on a plain `View` is the one thing in this whole app
// guaranteed to paint, so this trades a perfectly smooth edge for
// something that is definitely, unambiguously there.
const BANDS = [
  { width: SWEEP_WIDTH, opacity: 0.12 },
  { width: SWEEP_WIDTH * 0.55, opacity: 0.28 },
  { width: SWEEP_WIDTH * 0.22, opacity: 0.55 },
] as const;

/**
 * A soft diagonal band of light that sweeps continuously across the card,
 * left to right, no pause between passes — the "trophy catching the light"
 * cue for a finished challenge's card (`ChallengeStatusCardV2`,
 * `state === 'won'`), paired with the card's own dimmed ("apagado") opacity
 * in that same component. Per explicit request 2026-09-22.
 *
 * Real bug, found across TWO earlier attempts, both invisible ("not there at
 * all," reported directly, twice): first `expo-linear-gradient`'s
 * `<LinearGradient>` — that native module is used nowhere else in this app,
 * and on a custom dev client (not Expo Go) a module that's never been
 * exercised before is very plausibly not actually linked into the current
 * build. Rewritten on `@shopify/react-native-skia` next (proven working
 * everywhere else in this app's glow system) — STILL invisible, which
 * narrowed it down further: the one thing both attempts shared was
 * `useNativeDriver: true` driving a `transform` on an `Animated.View`
 * wrapping a nested custom-rendered child (a native gradient view, then a
 * Skia `Canvas`) — a real, known category of RN issue where the native
 * animation driver doesn't reliably apply to a transform sitting above a
 * specialized/non-standard native child view. Rebuilt a third time on the
 * most basic primitive in the whole framework instead: plain `View`s with a
 * flat `backgroundColor`/`opacity`, animated with `useNativeDriver: false`
 * (JS-driven, not the native driver at all) — trading a small, one-element,
 * decorative animation's perf for ruling out every native-driver-interop
 * question at once. If this still doesn't render, the bug is elsewhere
 * entirely (visibility/mounting), not the animation or drawing technology.
 *
 * Purely decorative: absolutely fills its parent (render it as a sibling
 * AFTER the card content, inside the same relatively-positioned wrapper, so
 * its bounds match the card's), `pointerEvents="none"`, and clipped to the
 * card's own `radius.big` corners so the band never spills past them.
 */
export function ChallengeCardShimmer() {
  const { width } = useWindowDimensions();
  const start = -SWEEP_WIDTH;
  const end = width + SWEEP_WIDTH;
  const translateX = useRef(new Animated.Value(start)).current;

  useEffect(() => {
    translateX.setValue(start);
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: end,
        duration: SWEEP_PASS_MS,
        easing: Easing.linear,
        // Deliberately false — see the component doc comment. This is one
        // decorative element on one card at a time; the JS-bridge cost is
        // irrelevant, and it rules out a whole class of native-driver
        // interop bugs the two earlier, invisible attempts may have hit.
        useNativeDriver: false,
      }),
      { resetBeforeIteration: true, iterations: -1 },
    );
    loop.start();
    return () => loop.stop();
  }, [translateX, start, end]);

  return (
    <View style={styles.clip} pointerEvents="none" testID="challenge-card-shimmer">
      <Animated.View style={[styles.band, { transform: [{ translateX }, { rotate: '20deg' }] }]}>
        {BANDS.map((band, i) => (
          <View
            key={i}
            style={[
              styles.innerBand,
              {
                width: band.width,
                left: (SWEEP_WIDTH - band.width) / 2,
                backgroundColor: withAlpha(colors.paper, band.opacity),
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.big,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    // Taller than the card so a rotated band still fully covers it top to bottom.
    top: -BAND_OVERHANG,
    bottom: -BAND_OVERHANG,
    // Explicit, not left unset: with `top`/`bottom` set but no `left`/`right`,
    // an absolutely positioned view's horizontal anchor is genuinely
    // ambiguous (Yoga's own default for that case differs by version).
    // `left: 0` pins it to the clip container's own left edge, so
    // `translateX` above is a clean, predictable offset from there.
    left: 0,
    width: SWEEP_WIDTH,
  },
  innerBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
