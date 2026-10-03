import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { Fill } from '@shopify/react-native-skia';
import { AccentDome } from '../ui/accentDome';
import { WebSafeCanvas } from '../ui/webSafeCanvas';
import { colors } from '../../constants/theme';

// Same recipe as `ChallengeAccentBackdrop` (the challenge-scoped screens'
// own backdrop) — per explicit request ("make sure your gradient matches
// the apps ones in tone and vibe"), not a new set of numbers. Only `edge`
// differs: `'bottom'`, so the light rises from the bottom edge instead of
// hanging from the top, per explicit request ("an activity colored light
// coming from the bottom").
const DOME_HALF_WIDTH = 0.62;
const DOME_DEPTH = 0.42;
const WASH_PEAK = 0.39;
const BLOOM_PEAK = 0.26;
const BLOOM_BLUR_RATIO = 0.04;
const GRAIN_OPACITY = 0.02;

// The very first screen's "light turning on" moment — slow and deliberate,
// fading in from nothing.
const TURN_ON_MS = 1400;
// Every screen after that: the light MERGES into the next color instead of
// turning off and back on — per explicit request (2026-09-24), the same
// mechanism Home's own gradient already uses for its challenge-carousel
// cross-fade (stacked layers, the new color fading in over the still-frozen
// previous one, `PagedGradientBackground`). Quicker than the initial
// turn-on, since it's a transition between two already-lit states, not a
// light coming on from nothing.
const CROSSFADE_MS = 600;

interface WelcomeGlowBackgroundProps {
  /** The current screen's own activity color — a different one per step. */
  color: string;
  /** Bump this (e.g. the wizard's current step index) to trigger a
   * transition to `color` — the FIRST value this component ever sees fades
   * in from nothing (see `TURN_ON_MS`); every value after that cross-fades
   * from whatever was showing (see `CROSSFADE_MS`). Can repeat (e.g.
   * swiping back to a page you were already on) — see `Layer.id` below for
   * why that's safe. */
  fadeKey: number | string;
}

interface Layer {
  /** A layer's REAL identity (React `key` + what `finished` cross-fades
   * filter by) — a monotonically increasing counter, deliberately NOT
   * `fadeKey`. Real bug, fixed 2026-09-25, per explicit "encountered two
   * children with the same key" + a real visual corruption report ("the
   * content just flew to the top of the screen"): `fadeKey` repeats
   * whenever the caller revisits an earlier step (e.g. swiping back and
   * forth across the intro pages, which this component's own consumer
   * explicitly supports) — using it as the layer key meant that swiping
   * back to a step before its PREVIOUS layer had finished cross-fading out
   * (600ms) and gotten cleaned up could leave two layers holding the exact
   * same React key at once, which is exactly the kind of key collision that
   * can make React misattribute state/native views between them. A plain
   * incrementing id can never collide, regardless of how the caller
   * navigates.
   */
  id: number;
  fadeKey: number | string;
  color: string;
  opacity: Animated.Value;
}

/**
 * The register wizard's backdrop (`app/(auth)/register.tsx`'s intro pages,
 * `app/onboarding/practices.tsx`'s onboarding-mode badges step): the same
 * dark screen + accent light every challenge-scoped screen already uses
 * (`ChallengeAccentBackdrop`/`AccentDome`), rising from the BOTTOM edge.
 *
 * Two distinct transitions, not one: the first color this component is ever
 * given "turns on" — a single layer fading in from nothing, the original
 * "slowly lighting up" request. Every color after that instead stacks a NEW
 * layer on top of the current one and fades IT in — since each layer draws
 * its own opaque `Fill` before its dome, the new layer completely covers the
 * old one by the time it reaches full opacity, so the transition reads as
 * one color smoothly turning into the next, never dipping back through
 * black. The covered layer is then dropped (not left stacked underneath
 * forever).
 *
 * Plain RN `Animated` opacity (native driver) per layer, not an animated
 * Skia prop — the same "animate a static Skia drawing's transform/opacity
 * from outside, don't animate Skia's own internals per frame" rule the rest
 * of this app's glow system already follows (see `ChallengeCardShimmer`'s
 * own doc comment for the case where animating a Skia child's `transform`
 * instead turned out unreliable — opacity on a wrapping `View` doesn't share
 * that problem).
 */
export function WelcomeGlowBackground({ color, fadeKey }: WelcomeGlowBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const nextLayerId = useRef(0);
  const [layers, setLayers] = useState<Layer[]>(() => [
    { id: nextLayerId.current++, fadeKey, color, opacity: new Animated.Value(0) },
  ]);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      Animated.timing(layers[0].opacity, {
        toValue: 1,
        duration: TURN_ON_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    const newLayer: Layer = { id: nextLayerId.current++, fadeKey, color, opacity: new Animated.Value(0) };
    setLayers((prev) => [...prev, newLayer]);
    Animated.timing(newLayer.opacity, {
      toValue: 1,
      duration: CROSSFADE_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      // Drop layers OLDER than this one (lower `id`) — never filter down to
      // "only this exact id". Real bug, fixed 2026-09-25, per "if you scroll
      // too fast on the carousel the gradients leave": swiping through
      // several pages within one CROSSFADE_MS window pushes layer B, then
      // layer C, before B's own crossfade has finished. The old
      // `l.id === newLayer.id` filter, run when B finishes, wiped out
      // EVERYTHING else including C — which was still mid-fade-in and had
      // its OWN pending `.start()` callback. When that callback later fired
      // for C, it filtered the (by-then-already-B-only) array down to
      // `l.id === C.id`, matched nothing, and left `layers` completely
      // empty — the Skia canvas (and its opaque `ink` Fill) briefly
      // vanished, exposing the plain container background with no glow at
      // all. Keeping "this layer and anything newer" instead means a
      // still-fading newer layer never gets orphaned, and the array can
      // never empty out from a legitimate completion.
      setLayers((prev) => prev.filter((l) => l.id >= newLayer.id));
    });
    // Only `fadeKey` drives a new layer — see this component's own prop doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fadeKey]);

  return (
    <>
      {layers.map((layer) => (
        <Animated.View
          key={layer.id}
          style={[StyleSheet.absoluteFill, { opacity: layer.opacity }]}
          pointerEvents="none"
        >
          <WebSafeCanvas style={StyleSheet.absoluteFill}>
            <Fill color={colors.ink} />
            <AccentDome
              width={width}
              height={height}
              color={layer.color}
              edge="bottom"
              domeHalfWidth={DOME_HALF_WIDTH}
              domeDepth={DOME_DEPTH}
              washPeak={WASH_PEAK}
              bloomPeak={BLOOM_PEAK}
              bloomBlur={width * BLOOM_BLUR_RATIO}
              grainOpacity={GRAIN_OPACITY}
            />
          </WebSafeCanvas>
        </Animated.View>
      ))}
    </>
  );
}
