import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { colors, radius } from "../../constants/theme";
import { withAlpha } from "../../utils/color";

const INACTIVE_ICON_COLOR = withAlpha(colors.paper, 0.42); // text-tertiary, see design system → Typography → Text opacity scale

function TabIcon({ name, focused }: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrapper}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? colors.primary : INACTIVE_ICON_COLOR}
      />
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: INACTIVE_ICON_COLOR,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search-outline" focused={focused} />
          ),
        }}
      />

      {/* ADD BUTTON (no tab) */}
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarLabel: "",
          tabBarItemStyle: {
            marginTop: -10,
          },
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <Ionicons name="add-outline" size={26} color={colors.ink} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/(add)/metrics");
          },
        }}
      />

      <Tabs.Screen
        name="challenges"
        options={{
          title: "Challenges",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="trophy-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    gap: 3,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    // Documented exception to "shadowColor is always #000" — the FAB
    // specifically gets a lime glow, see design system → Components →
    // Bottom Navigation.
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
  },
});
