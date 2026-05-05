import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export default function TabsLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.primary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => <Ionicons name="home" size={22} color={colors.primary} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: () => <Ionicons name="search" size={22} color={colors.primary} />,
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
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.surfaceHighlight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={36} color={colors.primary} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // evita navegación normal
            router.push("/(add)/metrics"); // abre flujo en metrics primero
          },
        }}
      />

      <Tabs.Screen
        name="challenges"
        options={{
          title: "Challenges",
          tabBarIcon: () => <Ionicons name="trophy" size={22} color={colors.primary} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => <Ionicons name="person" size={22} color={colors.primary} />,
        }}
      />
    </Tabs>
  );
}