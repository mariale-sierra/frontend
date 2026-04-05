import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
      <Stack.Screen name="(add)" options={{ presentation: "fullScreenModal" }} />
    </Stack>
  );
}