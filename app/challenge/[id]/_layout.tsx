import { Stack } from "expo-router";

export default function ChallengeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="progress" options={{ headerShown: false }} />
      <Stack.Screen name="info" options={{ headerShown: false }} />
      <Stack.Screen name="invite" options={{ headerShown: false }} />
      <Stack.Screen name="routine/[day]" options={{ headerShown: false }} />
      <Stack.Screen name="members" options={{ headerShown: false }} />
      {/* Join requests render directly inside Manage now — no separate
          screen (per explicit feedback that two screens for one job was
          redundant). */}
      <Stack.Screen name="manage" options={{ headerShown: false }} />
    </Stack>
  );
}
