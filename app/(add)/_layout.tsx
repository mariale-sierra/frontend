import { Stack } from "expo-router";

export default function AddLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="metrics" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="rest-day" />
    </Stack>
  );
}