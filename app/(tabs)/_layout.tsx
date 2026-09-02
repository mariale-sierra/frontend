import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";
import { withAlpha } from "../../utils/color";

const INACTIVE_ICON_COLOR = withAlpha(colors.paper, 0.48);
// Fixed-diameter true circle — `size/2` radius (see `fab` below) is the
// documented exception to "always radius.big for circular elements" (see
// design system skill's Numbered circle badge note), same exact 72px
// diameter camera.tsx's captureButton already uses for the same kind of
// element. Not a stray magic number — audited 2026-08-29, kept as-is.
const FAB_SIZE = 72;
// How far the FAB rises above the tab bar's own top edge (`fab`'s
// `marginTop` below). Extracted from an inline `-34` on the same audit —
// value intentionally unchanged (still exactly 34, not derived from
// FAB_SIZE/2 or anything else) since this was a deliberately eyeballed
// visual offset, not a formula; the constant just gives it a name instead
// of leaving it as an unexplained number in the stylesheet.
const FAB_OVERLAP = 34;

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
// Fixed 2026-08-29 without touching it at all: `tabBarBase` below is
// absolutely positioned 2px above its own normal top edge — that outer
// container has no `overflow: 'hidden'`, and content painted by
// `tabBarBackground` renders on top of the parent's own border in normal
// view stacking order, so this reliably covers the line. Safe precedent for
// any future "get rid of X default tab bar chrome" ask — extend
// `tabBarBase`'s own bounds, never reach for `tabBarStyle`. (The visible
// rounded pill shape, `tabBarPill`, is a second, smaller layer painted on
// top of `tabBarBase` — see its own doc comment below for why two layers.)
const ROUTE_ICON: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  index: "home-outline",
  search: "search-outline",
  challenges: "trophy-outline",
  profile: "person-outline",
};
// Filled counterpart of each icon above, swapped in only for the active
// tab — per explicit "make the selected icon's weight heavier" request.
// Ionicons doesn't expose a stroke-width/font-weight axis to bump directly
// (unlike DM Sans's per-weight font files elsewhere in this app), so the
// filled glyph is the real mechanism for "heavier" here, the same way
// Instagram/most tab bars distinguish an active icon from an inactive one.
// This is a different, narrower thing than the app's general "filled icons
// were swept to -outline" pattern elsewhere (activity/camera icons, a
// blanket style decision) — this is a per-STATE swap on exactly one glyph
// pair, scoped to the tab bar only.
const ROUTE_ICON_FOCUSED: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  index: "home",
  search: "search",
  challenges: "trophy",
  profile: "person",
};

function TabIcon({
  routeKey,
  focused,
}: {
  routeKey: keyof typeof ROUTE_ICON;
  focused: boolean;
}) {
  const name = focused ? ROUTE_ICON_FOCUSED[routeKey] : ROUTE_ICON[routeKey];
  return (
    <View style={styles.tabIconWrap}>
      <Ionicons name={name} size={22} color={focused ? colors.primary : INACTIVE_ICON_COLOR} />
    </View>
  );
}

function FabButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      accessibilityRole="button"
      hitSlop={8}
    >
      <Ionicons name="add-outline" size={28} color={colors.ink} />
    </Pressable>
  );
}

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <>
            <View style={styles.tabBarBase} />
            <View style={styles.tabBarPill} />
          </>
        ),
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon routeKey="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) => <TabIcon routeKey="search" focused={focused} />,
        }}
      />

      {/* FAB — not a real tab destination. tabBarButton swaps in a custom
          button and the tabPress listener stops it from ever trying to
          navigate to an "add" route; the actual navigation happens in
          onPress below. */}
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarItemStyle: styles.fabItem,
          tabBarButton: () => <FabButton onPress={() => router.push("/log")} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />

      <Tabs.Screen
        name="challenges"
        options={{
          title: "Challenges",
          tabBarIcon: ({ focused }) => <TabIcon routeKey="challenges" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon routeKey="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Two-layer background, settled on 2026-08-29 after two failed one-layer
  // attempts at a rounded pill — both looked "white" for the SAME underlying
  // reason, just triggered two different ways:
  //
  // React Navigation's own default hairline top border is drawn on the
  // OUTER Animated.View `tabBarBackground`'s content sits inside (the exact
  // container `tabBarStyle` would target — can't touch it, see the note
  // above). A plain full-bleed rectangle 2px above its own top edge covers
  // that border reliably (that part always worked). But `borderRadius` on
  // THAT SAME layer cuts its own corners away in a curve — at the corner
  // point itself, the rounded layer paints nothing, which re-exposes
  // whatever's underneath right there: the parent's own (light-themed by
  // default) hairline border, peeking through as a small bright arc at each
  // rounded corner. Insetting the pill (first attempt) added a SECOND
  // source of the same symptom — the outer container turns fully
  // transparent whenever a custom tabBarBackground exists, so the inset
  // margin had nothing underneath it either. Both read as "the background
  // is white."
  //
  // Fix: `tabBarBase` is the ORIGINAL, proven, un-rounded, full-bleed
  // covering rectangle — guarantees the border is 100% hidden everywhere,
  // completely independent of the pill's shape. `tabBarPill` — the actual
  // visible rounded/inset shape — sits on TOP of it. Since both are opaque
  // and only `tabBarPill`'s color is meant to be seen, any corner/inset area
  // `tabBarPill` doesn't cover just reveals `tabBarBase` (a deliberately
  // different, slightly darker tone — `colors.ink`, the app's own base
  // background, vs. `tabBarPill`'s `colors.surface`) instead of the border
  // or anything unexpected — which is also exactly the look of a pill
  // "floating" on the app's own dark background, not a bug to hide.
  tabBarBase: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.ink,
  },
  tabBarPill: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    // Inset from the bottom too, not just the sides — per explicit request,
    // a genuinely SHORTER floating pill rather than one that still reaches
    // all the way down into the safe-area padding zone. `tabBarBase` still
    // extends all the way to `bottom: 0` underneath, so the strip this
    // reveals below the pill is `colors.ink` — the app's own base
    // background, not a gap or a seam — reading as the pill floating on
    // the screen's own background rather than a cut-off shape. The tab
    // items' actual touch targets are untouched by any of this — this is
    // still purely the decorative `tabBarBackground` layer.
    bottom: spacing.lg,
    // `radius.big` (28) — the app's own token, already documented for "nav
    // bar" use (constants/theme.ts). Was a hardcoded `40` at first (picked
    // to force a true capsule regardless of exact pixel height, since RN
    // clamps an over-large radius to a shape's own half-height
    // automatically) — a real "no hardcoded values" violation caught on
    // audit. With the pill now shortened by the bottom inset above,
    // `radius.big` alone is already comfortably more than half its height,
    // so it still reads as a full capsule — no need for a non-token value.
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  // Was `spacing.sm` (8), bumped to `spacing.md` (12) once the pill shape
  // made "icons sit too high" noticeable, then back down here to `spacing.sm`
  // once removing the active-state dot (tabIconWrap's now-gone second child)
  // shortened the icon's own content height and made the same padding read
  // as "too low" instead. Nothing structural depends on this exact value —
  // easy to tune further either way.
  tabBarItem: {
    paddingTop: spacing.sm,
  },
  // Fixed 2026-08-29, per explicit "remove the little dot, doesn't match
  // the vibe anymore" request: was `alignItems/justifyContent/gap` for a
  // two-child layout (icon + the now-removed active-state dot below it).
  // No `gap` needed for a single child, but keeping the wrapper itself —
  // harmless, and this is a narrowly-scoped "remove the dot" ask, not an
  // invitation to also restructure how the icon is wrapped.
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  fabItem: {
    // The item slot stays a normal flex tab item (so it keeps its share of
    // the row's width) — the visual "overlap" comes entirely from the FAB's
    // own negative marginTop below.
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    marginTop: -FAB_OVERLAP,
    alignSelf: "center",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPressed: {
    opacity: 0.9,
  },
});
