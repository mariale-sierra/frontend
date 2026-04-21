import { Tabs, useRouter } from "expo-router";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />

      {/* ADD BUTTON (no tab) */}
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // evita navegación normal
            router.push("/(add)/metrics"); // abre flujo en metrics primero
          },
        }}
      />

      <Tabs.Screen name="challenges" options={{ title: "Challenges" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}