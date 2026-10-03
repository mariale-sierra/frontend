import { Stack } from "expo-router";

// `initialRouteName="login"` restored 2026-09-24: the standalone welcome
// carousel that made this ambiguous (see git history for that whole saga) is
// gone — its content is now the first steps of the register wizard itself
// (register.tsx), reached only by tapping "Register" on login, never shown
// up front. Login really is the one unconditional default for this group
// again, so this can be explicit about it same as before that ever existed.
export default function AuthLayout() {
  return <Stack initialRouteName="login" screenOptions={{ headerShown: false }} />;
}