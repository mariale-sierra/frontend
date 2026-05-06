import { Stack } from "expo-router";

export default function ChallengeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="info" options={{ headerShown: false }} />
      <Stack.Screen name="routine/[day]" options={{ headerShown: false }} />
    </Stack>
  );
}