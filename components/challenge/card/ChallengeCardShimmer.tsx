import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

const SWEEP_WIDTH = 90;
const SWEEP_PASS_MS = 1100;
const SWEEP_PAUSE_MS = 2400;

/**
 * A soft diagonal band of light that sweeps once across the card, pauses,
 * and repeats — the "trophy catching the light" cue for a finished
 * challenge's card (`ChallengeStatusCardV2`, `state === 'won'`), paired with
 * the card's own dimmed ("apagado") opacity in that same component. Per
 * explicit request 2026-09-22.
 *
 * Plain RN `Animated` (native driver), not `react-native-reanimated` —
 * deliberately, same reason Home's carousel light already avoids it (see
 * that component's own doc comment): this project's Jest setup has no mock
 * for `react-native-reanimated`/`react-native-worklets` (`app/(tabs)/index.tsx`'s
 * own test suite fails to even load because of it), and this card renders on
 * a screen with real test coverage, so pulling reanimated in here would take
 * a passing suite down with it.
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
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: end,
          duration: SWEEP_PASS_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Holds at `end` (off-card, invisible) for the pause, then snaps
        // back to `start` instantly to begin the next pass.
        Animated.delay(SWEEP_PAUSE_MS),
        Animated.timing(translateX, { toValue: start, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [translateX, start, end]);

  return (
    <View style={styles.clip} pointerEvents="none" testID="challenge-card-shimmer">
      <Animated.View style={[styles.band, { transform: [{ translateX }, { rotate: '20deg' }] }]}>
        <LinearGradient
          colors={[withAlpha(colors.paper, 0), withAlpha(colors.paper, 0.22), withAlpha(colors.paper, 0)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
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
    top: -40,
    bottom: -40,
    width: SWEEP_WIDTH,
  },
});
