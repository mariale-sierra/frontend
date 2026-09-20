import * as Haptics from 'expo-haptics';

/** A light tap of haptic feedback — the "selection changed / field focused"
 * touch used by the glass controls. Safe to call from `runOnJS`, and never
 * throws (haptics are unsupported on some devices and simulators). */
export function triggerLightHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
