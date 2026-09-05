import { useEffect, useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { BottomTabBarButtonProps } from 'expo-router/tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import {
  BOTTOM_NAV_BOTTOM_INSET,
  BOTTOM_NAV_BREATHE_SPRING,
  BOTTOM_NAV_HEIGHT,
  BOTTOM_NAV_ICON_SIZE,
  BOTTOM_NAV_LABEL_FONT_SIZE,
  BOTTOM_NAV_LABEL_LINE_HEIGHT,
  BOTTOM_NAV_PRESS_SPRING,
  BOTTOM_NAV_SHOW_LABELS,
  BOTTOM_NAV_TAB_COUNT,
  BOTTOM_NAV_TAB_PRESS_SCALE,
} from '../../constants/bottomNav';
import { settleBottomNavIndicator, useBottomNavContext } from './bottomNavContext';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);
const AnimatedText = Animated.createAnimatedComponent(RNText);

export const BOTTOM_NAV_INACTIVE_ICON_COLOR = withAlpha(colors.paper, 0.48);
// Full-opacity `paper`, not `ink` — the indicator behind the active tab is
// a subtle translucent gray chip (see bottomNavIndicator.tsx), not a
// bright solid fill, so a light icon reads correctly on top of it instead
// of needing a dark one for contrast.
const ACTIVE_ICON_COLOR = colors.paper;

function triggerLightHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

interface BottomNavTabButtonProps extends BottomTabBarButtonProps {
  index: number;
  tabSlotWidth: number;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconNameFocused: React.ComponentProps<typeof Ionicons>['name'];
  labelKey: string;
}

/**
 * Full custom `tabBarButton` for one of the four real tab destinations.
 * Ignores React Navigation's own pre-rendered `children` (default
 * icon/label) and renders its own — icon/label color and the outline-\>
 * filled crossfade are DERIVED directly from the shared `activeIndex`
 * value every frame (`1 - |activeIndex - index|`, clamped), not from the
 * discrete `aria-selected` flag — so a tab visually "picks up" activeness
 * continuously as the shared indicator (or a live drag) approaches it,
 * per the "the nearest tab should react while dragging" requirement, with
 * zero JS-thread involvement.
 *
 * Touch is a single `react-native-gesture-handler` Pan gesture (not a
 * `Pressable`) — see the drag section below for why a *plain* Pressable
 * couldn't give 1:1 finger-tracking on the UI thread. `aria-selected`
 * still drives one JS-thread `useEffect` as a safety net: if navigation
 * ever happens through a path other than this gesture (deep link, some
 * other future entry point), `activeIndex` still ends up in the right
 * place instead of only reacting to gestures that originate here.
 */
export function BottomNavTabButton({
  index,
  tabSlotWidth,
  iconName,
  iconNameFocused,
  labelKey,
  onPress,
  style,
  accessibilityLabel,
  testID,
  ...rest
}: BottomNavTabButtonProps) {
  const { t } = useTranslation();
  const label = t(labelKey);
  const {
    activeIndex,
    indicatorStretch,
    dragOrigin,
    lastHapticIndex,
    focusTab,
    registerOnPress,
    navigateToIndex,
    barExpansion,
  } = useBottomNavContext();
  const selected = Boolean((rest as { 'aria-selected'?: boolean })['aria-selected']);

  const pressScale = useSharedValue(1);

  // Always the latest `onPress` React Navigation handed this render — a
  // plain ref-style write during render (not an effect) so a drag that
  // settles on THIS tab from a gesture that started on a different one can
  // still call the real, current navigation handler. React Navigation's own
  // implementation (`BottomTabBar.tsx`) takes no arguments at all — the
  // event parameter in its TS type exists only for the web/anchor-tag case
  // this app doesn't use — so calling it with none is safe at runtime; the
  // cast just satisfies the (unnecessarily strict here) declared arity.
  const callOnPress = onPress as unknown as (() => void) | undefined;
  registerOnPress(index, () => callOnPress?.());

  useEffect(() => {
    if (selected) {
      focusTab(index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(4)
        .onBegin(() => {
          pressScale.value = withSpring(BOTTOM_NAV_TAB_PRESS_SCALE, BOTTOM_NAV_PRESS_SPRING);
          barExpansion.value = withSpring(1, BOTTOM_NAV_BREATHE_SPRING);
          // Capture the current VISUAL position. Starting a pan never moves
          // the indicator to the touched tab: that would teleport it before
          // the finger has travelled anywhere and breaks Home -> Profile
          // transitions. From an active selector this equals its tab index;
          // if a previous spring is still settling, it keeps the exact
          // in-flight position instead.
          lastHapticIndex.value = Math.round(activeIndex.value);
          dragOrigin.value = activeIndex.value;
        })
        .onUpdate((event) => {
          if (tabSlotWidth <= 0) {
            return;
          }

          const raw = dragOrigin.value + event.translationX / tabSlotWidth;
          const clamped = Math.min(Math.max(raw, 0), BOTTOM_NAV_TAB_COUNT - 1);
          activeIndex.value = clamped;
          const nearest = Math.round(clamped);
          if (nearest !== lastHapticIndex.value) {
            lastHapticIndex.value = nearest;
            runOnJS(triggerLightHaptic)();
          }
        })
        .onEnd(() => {
          const nearest = Math.min(Math.max(Math.round(activeIndex.value), 0), BOTTOM_NAV_TAB_COUNT - 1);
          settleBottomNavIndicator(activeIndex, indicatorStretch, nearest);
          // Navigation is deliberately the only JS bridge at release time.
          // `settleBottomNavIndicator` above is a UI-thread worklet, so the
          // selector remains fluid even while the route is changing.
          runOnJS(navigateToIndex)(nearest);
        })
        .onFinalize(() => {
          pressScale.value = withSpring(1, BOTTOM_NAV_PRESS_SPRING);
          barExpansion.value = withSpring(0, BOTTOM_NAV_BREATHE_SPRING);
        }),
    [
      activeIndex,
      barExpansion,
      dragOrigin,
      indicatorStretch,
      lastHapticIndex,
      navigateToIndex,
      pressScale,
      tabSlotWidth,
    ],
  );

  // The original implementation replaced React Navigation's Pressable with
  // a Pan-only detector. A short touch never activates a Pan (minDistance is
  // 4), so it needs its own explicit Tap gesture. `Race` keeps a real drag
  // from also becoming a second tap/navigation when the finger is released.
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .onBegin(() => {
          pressScale.value = withSpring(BOTTOM_NAV_TAB_PRESS_SCALE, BOTTOM_NAV_PRESS_SPRING);
          barExpansion.value = withSpring(1, BOTTOM_NAV_BREATHE_SPRING);
        })
        .onEnd((_event, success) => {
          if (!success) {
            return;
          }

          const previousIndex = Math.round(activeIndex.value);
          settleBottomNavIndicator(activeIndex, indicatorStretch, index);
          if (index !== previousIndex) {
            lastHapticIndex.value = index;
            runOnJS(triggerLightHaptic)();
          }
          runOnJS(navigateToIndex)(index);
        })
        .onFinalize(() => {
          pressScale.value = withSpring(1, BOTTOM_NAV_PRESS_SPRING);
          barExpansion.value = withSpring(0, BOTTOM_NAV_BREATHE_SPRING);
        }),
    [activeIndex, barExpansion, index, indicatorStretch, lastHapticIndex, navigateToIndex, pressScale],
  );

  const gesture = useMemo(() => Gesture.Race(pan, tap), [pan, tap]);

  // Single canonical read of `activeIndex` per tab — one `useDerivedValue`
  // instead of three separate `useAnimatedStyle`s each re-deriving the same
  // number from scratch. Every visual property below (icon opacity ×2,
  // icon/label color) now reads this ONE value, so there is exactly one
  // place that can ever be "out of sync" with the selector instead of three.
  const progress = useDerivedValue(() => 1 - Math.min(Math.abs(activeIndex.value - index), 1));

  // Each icon layer owns ONE combined animated style (opacity + color
  // together) instead of composing two separately-evaluated style objects
  // (`tintStyle` + a per-layer opacity style) onto the same native view —
  // fewer independent animated props for Reanimated/Fabric to reconcile per
  // frame on the same view.
  const iconOutlineStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    color: interpolateColor(progress.value, [0, 1], [BOTTOM_NAV_INACTIVE_ICON_COLOR, ACTIVE_ICON_COLOR]),
  }));
  const iconFilledStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    color: interpolateColor(progress.value, [0, 1], [BOTTOM_NAV_INACTIVE_ICON_COLOR, ACTIVE_ICON_COLOR]),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [BOTTOM_NAV_INACTIVE_ICON_COLOR, ACTIVE_ICON_COLOR]),
  }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  function handleAccessibilityActivate() {
    focusTab(index);
    navigateToIndex(index);
  }

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={accessibilityLabel}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') {
            handleAccessibilityActivate();
          }
        }}
        onAccessibilityTap={handleAccessibilityActivate}
        testID={testID}
        // `collapsable={false}`: this view has no paint properties of its
        // own (no backgroundColor/border), which makes it a Fabric
        // view-flattening candidate — and it's both a gesture target (RNGH)
        // and the thing Reanimated mutates every frame for the press-scale
        // style. Newer RN/Fabric versions flatten more aggressively than
        // when this was last verified on device (RN 0.81), which can make
        // per-frame native prop updates land inconsistently. Opting out of
        // flattening here is the documented fix for exactly that class of
        // symptom and changes nothing visually.
        collapsable={false}
        style={[style, styles.button, pressStyle]}
      >
        <View style={styles.iconSlot} collapsable={false}>
          <AnimatedIonicons
            name={iconName}
            size={BOTTOM_NAV_ICON_SIZE}
            style={[styles.iconLayer, iconOutlineStyle]}
          />
          <AnimatedIonicons
            name={iconNameFocused}
            size={BOTTOM_NAV_ICON_SIZE}
            style={[styles.iconLayer, iconFilledStyle]}
          />
        </View>
        {BOTTOM_NAV_SHOW_LABELS ? (
          <AnimatedText style={[styles.label, labelStyle]} numberOfLines={1}>
            {label}
          </AnimatedText>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Absolutely positioned within the tabBarItemStyle-sized item slot,
  // bottom-anchored the same BOTTOM_NAV_BOTTOM_INSET distance the capsule/
  // indicator in bottomNavBackground.tsx use — this is the real touch
  // target (icons/labels), confirmed correctly positioned on device; do
  // not move this to compensate for the background capsule's own
  // position — see that component's own doc comment for the real fix.
  button: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BOTTOM_NAV_BOTTOM_INSET,
    height: BOTTOM_NAV_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconSlot: {
    width: BOTTOM_NAV_ICON_SIZE,
    height: BOTTOM_NAV_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    fontSize: BOTTOM_NAV_LABEL_FONT_SIZE,
    lineHeight: BOTTOM_NAV_LABEL_LINE_HEIGHT,
  },
});
