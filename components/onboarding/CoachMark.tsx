import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/card';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { colors, fillOpacity, radius, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface CoachMarkProps {
  message: string;
  onDismiss: () => void;
  /** Positions the whole coach mark (wrapper + arrow) — the caller owns
   * where it points, this component only owns how it looks. */
  style?: StyleProp<ViewStyle>;
  /** Which edge the little arrow sits on and points toward:
   * - `bottomRight`: tail on the bottom edge, pointing down-right, for a
   *   bubble sitting ABOVE its target (e.g. the tab bar's FAB) — the only
   *   placement that's absolutely positioned floating over other content,
   *   so it's also the only one that sizes itself from the real screen
   *   width (see `floatingWidth`) rather than its own parent's width.
   * - `topRight`: tail on the top edge, pointing up-right, for a bubble
   *   sitting BELOW its target (e.g. the Explore tab's toggle) — same
   *   normal-flow, fills-its-parent width as `none`, just with an arrow.
   * - `none`: plain bubble, no arrow, for a tip that isn't pointing at
   *   anything external (e.g. a first-visit banner at the top of a list).
   */
  arrowPlacement?: 'bottomRight' | 'topRight' | 'none';
}

const FADE_IN_MS = 320;
const RISE_DISTANCE = 8;
// How far the floating bubble's right edge sits from the screen's right
// edge — matches `logCoachMark`'s own `right: spacing.lg` in
// app/(tabs)/index.tsx (its only current caller), so the computed width
// below lines up symmetrically with that same margin on the left too.
const FLOATING_MARGIN = spacing.lg;

/**
 * A single dismissible tooltip bubble — the "contextual tour" half of the
 * hybrid onboarding flow (see Stage 2, havit-design-system-SKILL.md). Shown
 * once per device per spot (each caller owns its own AsyncStorage "seen"
 * flag, same pattern as `utils/logCoachMark.ts`) — this component is just
 * the bubble, not the "have I shown this" logic.
 *
 * Dismiss is a real, explicitly-labeled "Got it" — not a tap-anywhere card
 * (tried first, then a bare icon-only tap target) — real bug, per repeated
 * "I click it and nothing happens" reports across two different attempts at
 * making the whole card the tap target. There's no guessing whether the
 * bubble is interactive at all, and no touch-target overlap with whatever
 * it's pointing at (e.g. the tab bar's FAB) — pressing elsewhere on the
 * card, or outside it, does nothing.
 *
 * "Got it" sits INLINE, as the tail end of the message's own sentence (not
 * a separate button row underneath) — per explicit request 2026-09-25: "the
 * got it button should be placed right besides the content text, at the end
 * of the sentence, not below." A nested `<Text onPress>` inside the message
 * `Text` is React Native's standard pattern for an inline, wrapping link —
 * it flows and wraps with the sentence like any other word, unlike a
 * `Pressable` sibling underneath.
 */
export function CoachMark({ message, onDismiss, style, arrowPlacement = 'bottomRight' }: CoachMarkProps) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  // Derived from `arrowPlacement`, not a caller-supplied override — real bug,
  // fixed 2026-09-24, per "the card is way too narrow, the text gets cut
  // off": every `arrowPlacement="none"` call site tried to cancel the
  // floating-bubble `maxWidth: 260` by passing `{ maxWidth: undefined }` in
  // its own `style`, assuming RN's style-array flattening would let
  // `undefined` clear the earlier value — it doesn't; the 260 stayed in
  // effect everywhere. Fixed at the source instead of in every caller.
  //
  // Only `bottomRight` (Home's absolutely-positioned FAB coach mark) needs
  // the computed-from-screen-width treatment — `topRight` (added 2026-09-25
  // for the Explore tab's toggle, pointing up at it) sits in NORMAL flow
  // inside its own already-padded parent, same as `none`, so it fills that
  // parent's width instead. Width strategy and arrow are two independent
  // concerns that happen to both be driven by this one prop, since each of
  // the 3 values maps to exactly one real caller today.
  const isFloating = arrowPlacement === 'bottomRight';
  const arrowOnTop = arrowPlacement === 'topRight';
  // Real screen width minus symmetric margins, not a fixed `maxWidth` — see
  // `wrapperFloating`'s own comment for why a fixed number was the actual
  // bug.
  const floatingWidth = { width: screenWidth - FLOATING_MARGIN * 2 };

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isFloating ? [styles.wrapperFloating, floatingWidth] : styles.wrapperInline,
        style,
        { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [RISE_DISTANCE, 0] }) }] },
      ]}
      pointerEvents="box-none"
    >
      {arrowOnTop && <View style={[styles.arrow, styles.arrowTop]} />}
      <Card variant="basic" padding="md" style={styles.bubble}>
        <View style={styles.content}>
          <Icon name="bulb-outline" size={18} color={colors.primary} />
          <Text variant="label" style={styles.message}>
            {message}{' '}
            <Text
              variant="label"
              weight="bold"
              onPress={onDismiss}
              accessibilityRole="button"
              style={styles.gotItInline}
            >
              {t('common.actions.gotIt')}
            </Text>
          </Text>
        </View>
      </Card>
      {arrowPlacement === 'bottomRight' && <View style={[styles.arrow, styles.arrowBottom]} />}
    </Animated.View>
  );
}

// 12 -> 16, per explicit "make the tail a bit longer" follow-up — the
// overlap trick below hides exactly half behind the card, so a bigger
// diamond means a bigger, longer-looking exposed tip too.
const ARROW_SIZE = 16;

const styles = StyleSheet.create({
  wrapper: {},
  // Real bug, fixed 2026-09-25, per explicit "you are considering it as a
  // square with the little message triangle at the center, this doesn't
  // work — it's more of a message square but with the tail at the far
  // right, that way it fits in the screen": a fixed `maxWidth` (260, then
  // doubled to 520 on an earlier "still too narrow" pass) let this bubble
  // shrink-wrap to its own short message instead of reaching a real,
  // screen-appropriate width — on an actual phone (~360-430px wide) it
  // rendered as a small compact block wrapped over 2-3 lines, closer to a
  // square than a message banner, regardless of what `maxWidth` said. Now
  // sized from the real screen width (`floatingWidth`, computed in the
  // component from `useWindowDimensions()`) minus symmetric margins — a
  // deliberately WIDE rectangle, properly bounded so it can never overflow
  // any device. `alignItems: 'stretch'` (not `'flex-end'`) is what makes
  // the Card actually fill that width instead of just floating inside a
  // wide-but-otherwise-unused wrapper; the arrow keeps its own fixed size
  // and `marginRight` (below), so it still lands at the bubble's far right
  // edge — now a deliberately wide message box with the tail at the end,
  // not a compact bubble with the tail underneath its center.
  wrapperFloating: {
    alignItems: 'stretch',
  },
  wrapperInline: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
    width: '100%',
  },
  // `width: '100%'` here (not split per-variant) — both the floating and
  // inline wrappers now want the Card to fill them; see each wrapper
  // style's own comment for why.
  bubble: {
    width: '100%',
    borderRadius: radius.medium,
    ...shadows.md,
  },
  // `alignItems: 'center'` (was `'flex-start'`), per explicit "make the
  // lightbulb icon centered vertically, right now it sits at the top"
  // follow-up — applies to every coach mark, since they all share this one
  // `content` row style.
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  message: {
    flex: 1,
    flexShrink: 1,
  },
  // A real pill — filled background + `radius.big`, not just bold colored
  // text — per explicit "the got it does need to have a round pill aspect
  // to it" follow-up. Still a NESTED `<Text>` (not a separate `Pressable`),
  // so it keeps flowing inline at the tail of the message's last line
  // rather than dropping to its own row — a short, single, un-wrapped run
  // like "Got it" renders its own background/radius as one contiguous
  // pill shape without the multi-line-inline-highlight quirks RN can have
  // on a LONGER nested span. `opacity: 1` cancels `Text`'s own tone-based
  // opacity (see that component's own doc comment on why a custom color
  // always needs this).
  gotItInline: {
    color: colors.primary,
    opacity: 1,
    backgroundColor: withAlpha(colors.primary, fillOpacity.chip),
    borderRadius: radius.big,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  // `alignSelf: 'flex-end'` explicitly, not inherited from the wrapper's own
  // `alignItems` — real bug, fixed 2026-09-25, per explicit "the tail is on
  // the right side, but a bit too far on the side, like the edge of the
  // card": `wrapperFloating` switched from `alignItems: 'flex-end'` to
  // `'stretch'` (needed so the Card fills the new wide width — see that
  // style's own comment), which also stripped the arrow's right-anchoring,
  // since a fixed-size child under `alignItems: 'stretch'` doesn't inherit
  // the same right-aligned position `'flex-end'` gave it — it lands flush
  // against the wrapper's true edge instead, with `marginRight` no longer
  // insetting it from anything. Anchoring the arrow itself, regardless of
  // the wrapper's own alignment, restores the intended small gap from the
  // card's real edge. Same shape either direction — a plain 45°-rotated
  // square reads as a diamond notch regardless of which edge it's attached
  // to; `arrowTop`/`arrowBottom` (below) only differ in which edge they
  // overlap.
  arrow: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    marginRight: spacing.lg,
  },
  // Pulls the diamond DOWN into the Card that follows it (this arrow is
  // rendered as the first child, before the Card — see the `arrowOnTop`
  // branch), hiding its top half behind the Card's top edge so only the
  // bottom tip pokes up above the bubble. `marginRight` moved spacing.lg
  // (24) -> spacing.xl (32) -> spacing['3xl'] (64) -> a literal 85, per
  // explicit follow-ups landing on that exact pixel value — a fine-tuned
  // visual offset, not a semantic inter-element gap, so it's exempt from
  // the spacing scale the same way this file's other one-off geometry
  // constants are (e.g. register.tsx's `FAN_OFFSET`). Overrides the shared
  // `arrow` style's own `marginRight` for this direction only, leaving
  // `arrowBottom`/Home's already-confirmed position untouched.
  arrowTop: {
    marginBottom: -ARROW_SIZE / 2 - 1,
    marginRight: 85,
  },
  // Pulls the diamond UP into the Card that precedes it (this arrow is
  // rendered after the Card), hiding its top half behind the Card's bottom
  // edge so only the bottom tip pokes out below the bubble.
  arrowBottom: {
    marginTop: -ARROW_SIZE / 2 - 1,
  },
});
