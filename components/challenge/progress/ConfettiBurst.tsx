import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { activityColors, colors } from '../../../constants/theme';

const PIECE_COUNT = 46;
const DURATION_MS = 2400;
const PIECE_COLORS = [colors.success, colors.primary, colors.rest, ...Object.values(activityColors)];

interface Piece {
  /** Start x, as a fraction of the screen's width (0..1). */
  x: number;
  width: number;
  height: number;
  color: string;
  /** How far into the fall this piece starts (0..1) — pieces don't all start together. */
  delayFraction: number;
  /** How far it drifts sideways over the fall, in px — some pieces zig one way, some the other. */
  drift: number;
  /** Full rotations over the whole fall. */
  spins: number;
}

function buildPieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    x: Math.random(),
    width: 5 + Math.random() * 5,
    height: 8 + Math.random() * 8,
    color: PIECE_COLORS[i % PIECE_COLORS.length],
    delayFraction: Math.random() * 0.3,
    drift: (Math.random() - 0.5) * 70,
    spins: 1.5 + Math.random() * 2.5,
  }));
}

interface ConfettiBurstProps {
  /** Bursts once whenever this is true on mount (or flips false -> true) — see
   * the component doc comment for why there's no "seen before" gating. */
  active: boolean;
}

/**
 * A once-per-visit confetti burst — the Consistency/progress screen's
 * celebration for a FINISHED challenge (`state === 'won'`), per explicit
 * request 2026-09-22 ("when I access the finished progress screen ... get a
 * confetti effect"). Unlike the "Challenge complete" popup
 * (`ChallengeFinishedPopup`, shown once ever via `shownCompletions`), this
 * replays every time the screen is opened — that's literally what was asked
 * for, and this screen is a fresh mount per visit (Expo Router), so "once per
 * mount" already means "once per visit," no seen-before store needed.
 *
 * Plain RN `Animated` (native driver), not `react-native-reanimated` — same
 * reason `ChallengeCardShimmer` avoids it (see its own doc comment): this
 * project's Jest setup has no working mock for reanimated/worklets outside
 * the handful of test files that add one manually, and this component sits
 * on a screen with real test coverage.
 *
 * One shared driver value (`fall`, 0 -> 1) computes every piece's position in
 * `useAnimatedStyle`-equivalent inline style functions — cheap even at ~46
 * pieces, since there's only one animated value actually ticking.
 */
export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => buildPieces(), []);
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    fall.setValue(0);
    Animated.timing(fall, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [active, fall]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="confetti-burst">
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} fall={fall} width={width} height={height} />
      ))}
    </View>
  );
}

interface ConfettiPieceProps {
  piece: Piece;
  fall: Animated.Value;
  width: number;
  height: number;
}

function ConfettiPiece({ piece, fall, width, height }: ConfettiPieceProps) {
  // Each piece runs over its own slice of `fall` (staggered by `delayFraction`),
  // clamped to [0, 1] at both ends via `extrapolate: 'clamp'` so it holds its
  // start position before its delay and its end position after landing,
  // rather than overshooting.
  const localStart = piece.delayFraction;
  const translateY = fall.interpolate({
    inputRange: [localStart, 1],
    outputRange: [-20, height + 20],
    extrapolate: 'clamp',
  });
  const translateX = fall.interpolate({
    inputRange: [localStart, (localStart + 1) / 2, 1],
    outputRange: [0, piece.drift, 0],
    extrapolate: 'clamp',
  });
  const rotate = fall.interpolate({
    inputRange: [localStart, 1],
    outputRange: ['0deg', `${piece.spins * 360}deg`],
    extrapolate: 'clamp',
  });
  const opacity = fall.interpolate({
    inputRange: [localStart, Math.min(1, localStart + 0.05), 0.88, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.x * width,
          width: piece.width,
          height: piece.height,
          backgroundColor: piece.color,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 1,
  },
});
