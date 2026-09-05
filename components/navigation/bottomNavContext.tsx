import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import {
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  BOTTOM_NAV_BREATHE_SPRING,
  BOTTOM_NAV_INDICATOR_SPRING,
  BOTTOM_NAV_STRETCH_SETTLE_SPRING,
  BOTTOM_NAV_TRAVEL_STRETCH_DURATION_MS,
} from '../../constants/bottomNav';

interface BottomNavContextValue {
  /** Animated tab position, 0..3 — the single source of truth the sliding
   * indicator (drawn in the decorative background layer) reads every frame.
   * Also the value a drag directly writes to in real time (see
   * bottomNavTabButton.tsx's pan gesture) — a spring-settled position and a
   * live-dragged position are the same shared value, not two competing
   * mechanisms. */
  activeIndex: SharedValue<number>;
  /** 0 at rest, briefly pulses toward 1 and back whenever the indicator
   * starts a move — drives its subtle travel stretch/squash. */
  indicatorStretch: SharedValue<number>;
  /** 0 at rest, springs to 1 while any tab is actively pressed/dragged —
   * the whole capsule's own almost-subconscious "breathe" while touched. */
  barExpansion: SharedValue<number>;
  /** Tab index the current drag gesture started from — captured once per
   * gesture (`onBegin`) so `onUpdate` can compute an absolute position from
   * the finger's relative translation. */
  dragOrigin: SharedValue<number>;
  /** The last tab index a haptic tick has already fired for during the
   * current gesture — read/written entirely on the UI thread inside the
   * pan gesture's worklets, so a fast drag across several tabs fires
   * exactly one tick per newly-entered tab, never one per frame. */
  lastHapticIndex: SharedValue<number>;
  /** Moves the shared indicator to `index` with a spring — call on tap
   * (immediately, before navigation resolves) or once a drag settles. */
  focusTab: (index: number) => void;
  /** Toggle the shared "being pressed" state driving `barExpansion`. */
  setBarPressed: (pressed: boolean) => void;
  /** Each tab registers its own real `onPress` (the one React Navigation
   * handed it — actual navigation + tabPress event) here, keyed by index,
   * so a drag/tap that settles on a DIFFERENT tab than the one the gesture
   * started on can still trigger that tab's real navigation. Called every
   * render with the latest closure (cheap ref write, no effect needed). */
  registerOnPress: (index: number, onPress: () => void) => void;
  /** Invokes the registered `onPress` for `index`, if any. */
  navigateToIndex: (index: number) => void;
}

const BottomNavContext = createContext<BottomNavContextValue | null>(null);

/**
 * The one animation used for both a tap and the end of a drag. This must
 * stay a worklet: gesture callbacks run on the UI thread, while route-sync
 * effects call the same helper from JS. Keeping the visual transition here
 * prevents the route update from becoming a second, competing source of
 * truth for the indicator's position.
 */
export function settleBottomNavIndicator(
  activeIndex: SharedValue<number>,
  indicatorStretch: SharedValue<number>,
  index: number,
) {
  'worklet';

  activeIndex.value = withSpring(index, BOTTOM_NAV_INDICATOR_SPRING);
  indicatorStretch.value = withSequence(
    withTiming(1, { duration: BOTTOM_NAV_TRAVEL_STRETCH_DURATION_MS }),
    withSpring(0, BOTTOM_NAV_STRETCH_SETTLE_SPRING),
  );
}

export function BottomNavProvider({
  initialIndex,
  children,
}: {
  initialIndex: number;
  children: ReactNode;
}) {
  const activeIndex = useSharedValue(initialIndex);
  const indicatorStretch = useSharedValue(0);
  const barExpansion = useSharedValue(0);
  const dragOrigin = useSharedValue(initialIndex);
  const lastHapticIndex = useSharedValue(initialIndex);
  const onPressByIndex = useRef<Record<number, () => void>>({});
  // A tab gesture starts the visual animation before asking React Navigation
  // to change routes. Once that route reports itself as selected, skip its
  // matching route-sync animation so it cannot restart the same spring or
  // stretch halfway through travel. External route changes still animate.
  const pendingNavigationIndex = useRef<number | null>(null);

  const focusTab = useCallback(
    (index: number) => {
      if (pendingNavigationIndex.current === index) {
        pendingNavigationIndex.current = null;
        return;
      }

      settleBottomNavIndicator(activeIndex, indicatorStretch, index);
    },
    [activeIndex, indicatorStretch],
  );

  const setBarPressed = useCallback(
    (pressed: boolean) => {
      barExpansion.value = withSpring(pressed ? 1 : 0, BOTTOM_NAV_BREATHE_SPRING);
    },
    [barExpansion],
  );

  const registerOnPress = useCallback((index: number, onPress: () => void) => {
    onPressByIndex.current[index] = onPress;
  }, []);

  const navigateToIndex = useCallback((index: number) => {
    pendingNavigationIndex.current = index;
    onPressByIndex.current[index]?.();
    // Safety net for a real edge case: tapping/dragging back onto the tab
    // that's ALREADY active is a no-op for React Navigation — `aria-selected`
    // for that tab never flips, so the `focusTab` effect that would normally
    // clear this flag (see above) never runs, and it would otherwise stay
    // "stuck" pointing at `index` forever. A stale flag here would then
    // incorrectly suppress a LATER, genuinely external route sync (e.g. a
    // deep link straight into this same tab) from animating the indicator
    // to match, leaving it visually stuck on the wrong tab. This only ever
    // fires when nothing already cleared the flag in the meantime.
    setTimeout(() => {
      if (pendingNavigationIndex.current === index) {
        pendingNavigationIndex.current = null;
      }
    }, 400);
  }, []);

  const value = useMemo<BottomNavContextValue>(
    () => ({
      activeIndex,
      indicatorStretch,
      barExpansion,
      dragOrigin,
      lastHapticIndex,
      focusTab,
      setBarPressed,
      registerOnPress,
      navigateToIndex,
    }),
    [
      activeIndex,
      indicatorStretch,
      barExpansion,
      dragOrigin,
      lastHapticIndex,
      focusTab,
      setBarPressed,
      registerOnPress,
      navigateToIndex,
    ],
  );

  return <BottomNavContext.Provider value={value}>{children}</BottomNavContext.Provider>;
}

export function useBottomNavContext() {
  const ctx = useContext(BottomNavContext);
  if (!ctx) {
    throw new Error('useBottomNavContext must be used within a BottomNavProvider');
  }
  return ctx;
}
