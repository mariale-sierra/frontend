import { Stack } from "expo-router";

export default function ChallengeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Challenge" }} />
      <Stack.Screen name="info" options={{ title: "info" }} />
    </Stack>
  );
}