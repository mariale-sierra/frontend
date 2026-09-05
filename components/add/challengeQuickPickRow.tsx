import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { Easing, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { colors, fillOpacity, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getChallengeAccentColor } from '../../services/adapters/challengeState';
import type { LogChallengeQuickPick } from '../../services/adapters/metricsAdapter';

interface ChallengeQuickPickRowProps {
  challenge: LogChallengeQuickPick;
  onPress: () => void;
  /** Position in the list — drives the entrance stagger and its haptic, see below. */
  index: number;
}

// The image fills the row's own full height edge-to-edge (no padding around
// it, flush against the row's top/bottom/left) — this constant IS the row's
// height, not a separate thumbnail size sitting inside padding.
const ROW_HEIGHT = 72;

// Same activity-color-at-reduced-opacity value used for both the supporting
// "Day N" label and the trailing chevron.
const SUPPORTING_OPACITY = 0.68;

const ROW_ENTRANCE_STAGGER_MS = 60;
const ROW_ENTRANCE_DURATION_MS = 260;

function triggerRowHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/**
 * One row in the "Log today's progress" challenge picker.
 *
 * Each challenge has its own independent `colors.surface` card — name and
 * day label both render in that challenge's own activity accent color
 * (Activity Color System v2) at FULL opacity (the chevron stays at a
 * reduced accent opacity — a subtle affordance icon, not "text"), separated
 * from its neighbors by real gap (`Stack gap` in app/log.tsx). The photo
 * sits flush against the card's own left/top/bottom edges (no padding
 * around it, sized to the row's full height); the card's `overflow: hidden`
 * is what clips the image's outer corners to match the card's own rounded
 * shape, rather than duplicating the radius by hand.
 */
export function ChallengeQuickPickRow({ challenge, onPress, index }: ChallengeQuickPickRowProps) {
  const { t } = useTranslation();
  const dayLabel = t('logMetrics.pickChallenge.dayLabel', { day: challenge.currentDay });
  // Activity Color System v2 — falls back to colors.primary (white) when
  // this challenge has no dominant category yet.
  const accentColor = getChallengeAccentColor(challenge.dominantActivityCategory);

  // Haptic fires on a plain JS timer matching the visual stagger delay,
  // rather than hooking into the (UI-thread) entering animation's own
  // lifecycle — simpler and reliable, and "roughly when the row appears" is
  // exactly what was asked for, not "exactly on the animation's last frame."
  useEffect(() => {
    const timer = setTimeout(triggerRowHaptic, index * ROW_ENTRANCE_STAGGER_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      entering={ZoomIn.duration(ROW_ENTRANCE_DURATION_MS)
        .delay(index * ROW_ENTRANCE_STAGGER_MS)
        .easing(Easing.out(Easing.quad))}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {challenge.photoUrl ? (
          <Image source={{ uri: challenge.photoUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Icon name="image-outline" size={22} color={withAlpha(colors.paper, textOpacity.tertiary)} />
          </View>
        )}

        <View style={styles.textColumn}>
          <Text
            variant="body"
            size="lg"
            weight="bold"
            numberOfLines={1}
            style={[styles.title, { color: accentColor }]}
          >
            {challenge.name}
          </Text>
          <Text
            variant="label"
            weight="medium"
            numberOfLines={1}
            style={[styles.dayLabel, { color: accentColor }]}
          >
            {dayLabel}
          </Text>
        </View>

        <View style={styles.chevronWrap}>
          {/* Filled `chevron-forward` — a deliberate, explicit exception to
              the design system's outline-only rule (flagged as such before
              implementing, same as the per-exercise activity-color badge's
              own documented exception), per direct request for a heavier
              chevron a bigger outline glyph didn't deliver on its own. */}
          <Icon name="chevron-forward" size={18} color={withAlpha(accentColor, SUPPORTING_OPACITY)} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    backgroundColor: colors.surface,
    // A bit rounder than this same card's earlier pass (`radius.medium`,
    // 16) per explicit "rounding each card a bit more" — one tier up, still
    // short of `xl`/pill territory that was rejected earlier in the session.
    borderRadius: radius.big,
    // Clips the flush-left image to this same rounded shape — see the
    // image's own comment below.
    overflow: 'hidden',
    // Narrower than the modal's own content width, per explicit "shorter in
    // width" direction — applied to the ROW, not the image, so the image
    // still sits flush against THIS row's own edge, not the screen's.
    marginHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  // No margin/padding, no radius of its own — flush against the card's
  // top/bottom/left edges, sized to exactly fill the row's height. The
  // card's own `overflow: hidden` + `borderRadius` (above) clips this
  // image's outer corners to match, rather than this needing to duplicate
  // that radius value by hand.
  image: {
    width: ROW_HEIGHT,
    height: ROW_HEIGHT,
    flexShrink: 0,
  },
  imagePlaceholder: {
    // `paper`@20% — the app's own documented "no photo yet" placeholder
    // token, for a placeholder sitting on ink/surface (as opposed to
    // `fillOpacity.washOnAccent`, the `ink`-based version for a colored
    // card background).
    backgroundColor: withAlpha(colors.paper, fillOpacity.placeholder),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Only the text side gets its own inset (from the image, and from the
  // chevron) — the row itself stays padding-free so the image can bleed to
  // its edge. No `gap` between the title and day label below them — the
  // `Text` variants' own line-height already gives them breathing room;
  // any explicit gap on top of that read as too loose.
  textColumn: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  title: {
    opacity: 1,
  },
  dayLabel: {
    opacity: 1,
  },
  chevronWrap: {
    marginRight: spacing.sm,
  },
});
