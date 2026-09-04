import { useMemo } from "react";
import { Tabs, useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import type { Ionicons } from "@expo/vector-icons";
import { BottomNavProvider } from "../../components/navigation/bottomNavContext";
import { BottomNavBackground } from "../../components/navigation/bottomNavBackground";
import { BottomNavTabButton } from "../../components/navigation/bottomNavTabButton";
import { BottomNavFab } from "../../components/navigation/bottomNavFab";
import {
  BOTTOM_NAV_CAPSULE_GAP,
  BOTTOM_NAV_FAB_SIZE,
  BOTTOM_NAV_OUTER_MARGIN,
  getBottomNavGeometry,
} from "../../constants/bottomNav";

// ROOT CAUSE, CONFIRMED ON DEVICE (iOS, New Architecture/Fabric enabled) —
// setting `tabBarStyle` on <Tabs screenOptions> makes the ENTIRE tab bar
// unresponsive to touch, regardless of its content (even just
// `{ backgroundColor, borderTopWidth: 0 }` alone reproduces it). This was
// isolated via clean bisection from a known-working baseline: swapping only
// `tabBarStyle` for `tabBarBackground` (a separate option that paints a
// decorative layer behind the tab items, already wrapped in
// pointerEvents="none" unconditionally inside BottomTabBar.js itself) fixed
// it with nothing else changed. A previous, fully custom `tabBar` render
// prop hit what was very likely this same underlying issue from a different
// angle and was scrapped in favor of this.
//
// DO NOT set `tabBarStyle` (directly, via screenOptions, or per-screen
// options) without re-testing touch on a real iOS device first. Get visual
// styling for the bar via `tabBarBackground` + `tabBarItemStyle` instead, as
// below. This includes the default hairline top border `tabBarStyle` would
// normally suppress — that border is baked into React Navigation's own
// BottomTabBar.tsx (drawn on the same outer container `tabBarStyle` would
// target), and CANNOT be turned off via any prop that isn't `tabBarStyle`.
//
// 2026-09-04 redesign: this file used to render its own tabBarBackground/
// icon/FAB inline. Both are now components/navigation/* (BottomNavBackground,
// BottomNavTabButton, BottomNavFab) so the capsule shape, the shared sliding
// indicator, and the per-tab press/color animations aren't all crammed into
// one file — but the underlying constraint above is unchanged and still
// governs every one of those files: NEITHER touches `tabBarStyle` nor a
// custom `tabBar` prop. All visual/interactive control still flows through
// `tabBarBackground` (BottomNavBackground, decorative, pointerEvents="none")
// and per-screen `tabBarButton`/`tabBarItemStyle` (BottomNavTabButton /
// BottomNavFab — real interactive views, the same *category* of extension
// point the old FAB already used safely; BottomNavTabButton's touch is a
// react-native-gesture-handler Pan gesture rather than a plain Pressable,
// added specifically so the drag-to-switch-tabs indicator can track a
// finger 1:1 on the UI thread — still ONLY inside this already-safe
// per-item slot, never touching tabBarStyle or the tab bar's own gesture
// surface). Re-read this comment before reaching for either forbidden
// option again.
const ROUTE_ICON: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  index: "home-outline",
  search: "search-outline",
  challenges: "trophy-outline",
  profile: "person-outline",
};
// Filled counterpart of each icon above, crossfaded in only for the active
// tab — see BottomNavTabButton's own doc comment for how the crossfade
// itself works. Same per-STATE icon-weight swap this tab bar has used since
// before this redesign, now driven by an animated opacity blend instead of
// an instant snap.
const ROUTE_ICON_FOCUSED: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  index: "home",
  search: "search",
  challenges: "trophy",
  profile: "person",
};

const ROUTE_LABEL_KEY: Record<string, string> = {
  index: "navigation.tabs.home",
  search: "navigation.tabs.search",
  challenges: "navigation.tabs.challenges",
  profile: "navigation.tabs.profile",
};

const ROUTE_INDEX: Record<string, number> = {
  index: 0,
  search: 1,
  challenges: 2,
  profile: 3,
};

export default function TabsLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { tabEdgeInset, tabSlotWidth } = getBottomNavGeometry(width);

  // Only `width` (+ margins, for the outer-edge/gap items) matters here —
  // each real button (BottomNavTabButton / BottomNavFab) positions itself
  // with `position: 'absolute', bottom: BOTTOM_NAV_BOTTOM_INSET` against
  // this slot's own bounds, rather than relying on this wrapper's flex
  // alignment (that was tried first and didn't match React Navigation's
  // actual per-item box on device — content rendered pinned to the top of
  // a much taller slot instead of bottom-anchored). `flex: 0` cancels the
  // default `flex: 1` React Navigation's BottomTabBar applies to every
  // item, which would otherwise stretch these past their explicit width.
  // Memoized so these style objects (and therefore each Tabs.Screen's
  // `options`) keep a stable identity across renders that don't actually
  // change the screen width — avoids handing React Navigation a "new"
  // options object (and re-triggering its own internal options-change
  // handling) on every unrelated re-render, e.g. a plain tab switch.
  const tabItemStyle = useMemo(() => ({ flex: 0 as const, width: tabSlotWidth }), [tabSlotWidth]);
  const firstTabItemStyle = useMemo(
    () => ({ ...tabItemStyle, marginLeft: BOTTOM_NAV_OUTER_MARGIN + tabEdgeInset }),
    [tabEdgeInset, tabItemStyle],
  );
  const lastTabItemStyle = useMemo(
    () => ({ ...tabItemStyle, marginRight: tabEdgeInset }),
    [tabEdgeInset, tabItemStyle],
  );
  const fabItemStyle = useMemo(
    () => ({
      flex: 0 as const,
      width: BOTTOM_NAV_FAB_SIZE,
      marginLeft: BOTTOM_NAV_CAPSULE_GAP,
      marginRight: BOTTOM_NAV_OUTER_MARGIN,
    }),
    [],
  );

  return (
    <BottomNavProvider initialIndex={0}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarBackground: () => <BottomNavBackground />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarItemStyle: firstTabItemStyle,
            tabBarButton: (props) => (
              <BottomNavTabButton
                {...props}
                index={ROUTE_INDEX.index}
                tabSlotWidth={tabSlotWidth}
                iconName={ROUTE_ICON.index}
                iconNameFocused={ROUTE_ICON_FOCUSED.index}
                labelKey={ROUTE_LABEL_KEY.index}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarItemStyle: tabItemStyle,
            tabBarButton: (props) => (
              <BottomNavTabButton
                {...props}
                index={ROUTE_INDEX.search}
                tabSlotWidth={tabSlotWidth}
                iconName={ROUTE_ICON.search}
                iconNameFocused={ROUTE_ICON_FOCUSED.search}
                labelKey={ROUTE_LABEL_KEY.search}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="challenges"
          options={{
            title: "Challenges",
            tabBarItemStyle: tabItemStyle,
            tabBarButton: (props) => (
              <BottomNavTabButton
                {...props}
                index={ROUTE_INDEX.challenges}
                tabSlotWidth={tabSlotWidth}
                iconName={ROUTE_ICON.challenges}
                iconNameFocused={ROUTE_ICON_FOCUSED.challenges}
                labelKey={ROUTE_LABEL_KEY.challenges}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarItemStyle: lastTabItemStyle,
            tabBarButton: (props) => (
              <BottomNavTabButton
                {...props}
                index={ROUTE_INDEX.profile}
                tabSlotWidth={tabSlotWidth}
                iconName={ROUTE_ICON.profile}
                iconNameFocused={ROUTE_ICON_FOCUSED.profile}
                labelKey={ROUTE_LABEL_KEY.profile}
              />
            ),
          }}
        />

        {/* FAB — not a real tab destination, and (per this redesign) no
            longer positioned between other tabs: it's declared LAST so it
            renders as the rightmost item, visually separated from the tab
            capsule by BOTTOM_NAV_CAPSULE_GAP (see fabItemStyle above) —
            "+", conceptually an action, not part of the tab set. tabPress
            is still prevented and onPress still navigates straight to
            /log, exactly as before; only where/how it's drawn changed. */}
        <Tabs.Screen
          name="add"
          options={{
            title: "Add",
            tabBarItemStyle: fabItemStyle,
            tabBarButton: () => (
              <BottomNavFab onPress={() => router.push("/log")} accessibilityLabel={t("navigation.addButtonA11y")} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
      </Tabs>
    </BottomNavProvider>
  );
}
