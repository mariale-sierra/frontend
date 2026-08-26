import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, spacing } from "../../constants/theme";
import { withAlpha } from "../../utils/color";

const INACTIVE_ICON_COLOR = withAlpha(colors.paper, 0.48);
const FAB_SIZE = 72;

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
// below.
const ROUTE_ICON: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  index: "home-outline",
  search: "search-outline",
  challenges: "trophy-outline",
  profile: "person-outline",
};

function TabIcon({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  focused: boolean;
}) {
  return (
    <View style={styles.tabIconWrap}>
      <Ionicons name={name} size={22} color={focused ? colors.primary : INACTIVE_ICON_COLOR} />
      <View style={[styles.dot, focused && styles.dotActive]} />
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
        tabBarBackground: () => <View style={styles.tabBarBg} />,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon name={ROUTE_ICON.index} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) => <TabIcon name={ROUTE_ICON.search} focused={focused} />,
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
          tabBarIcon: ({ focused }) => <TabIcon name={ROUTE_ICON.challenges} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon name={ROUTE_ICON.profile} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBg: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  tabBarItem: {
    paddingTop: spacing.sm,
  },
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "transparent",
  },
  dotActive: {
    backgroundColor: colors.primary,
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
    marginTop: -34,
    alignSelf: "center",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPressed: {
    opacity: 0.9,
  },
});
