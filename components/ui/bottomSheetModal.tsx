import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Keyboard, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import type { KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fillOpacity, radius, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { GlassBackdrop, GlassHighlight, glassRimmedStyle } from './glassSurface';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const ANIM_DURATION = 260;
// The sheet's top corners, which a glass sheet's rim follows.
const SHEET_RADIUS = radius.big;

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Passed straight through to the sheet's own `maxHeight` style. Content
   * shorter than this sizes down to fit — fine for the exercise filter
   * sheets (categories/locations/muscles), which want to hug their content. */
  maxHeight?: `${number}%`;
  /** Pins the sheet to exactly this height instead of sizing to content.
   * CommentsSheet needs this — with only `maxHeight`, a post with just one
   * or two comments rendered as a short strip hugging the bottom edge
   * instead of a real panel, and left no room above the keyboard for the
   * composer to rise into (real, reported bug: "displays at the bottom,
   * not up to half the screen"). */
  height?: `${number}%`;
  /** Makes the sheet frosted glass — the blur and the translucent `surface` tint the
   * nav bar and the toggles have, and the gradient rim along its top edge — instead of
   * an opaque `surface` card, so what is behind it shows through (the comments sheet). */
  glass?: boolean;
  /**
   * Renders the same backdrop+sheet as a plain absolutely-positioned overlay in the
   * caller's own tree instead of inside RN's own `<Modal>` (a separate native
   * window/surface). Every other use of this component is opened from an ordinary,
   * non-modal screen, where a nested `<Modal>` is the normal, safe way to sit above
   * everything; TagParticipantsSheet is opened from app/(add)/camera.tsx, which is
   * ITSELF already presented as a native `fullScreenModal` route (see app/_layout.tsx)
   * — nesting RN's `<Modal>` inside an already-modally-presented screen is a
   * documented React Native/react-native-screens footgun, and the likely cause of a
   * real, reported crash right when this sheet's content was interacted with. Default
   * `false` keeps every existing caller's exact prior behavior unchanged. */
  renderInPlace?: boolean;
}

/** Shared bottom-sheet shell for the exercise filter sheets (categories,
 * locations, muscles). The dark backdrop and the sheet are two SEPARATE
 * animated layers — backdrop fades opacity 0->1 in place, sheet slides via
 * `translateY` — rather than one native `Modal animationType="slide"`
 * transition. That native transition moves the whole modal content
 * together, which visibly dragged the backdrop up from the bottom along
 * with the sheet (real reported bug). Both layers are absolutely
 * positioned so neither depends on Modal's default flex stacking. */
export function BottomSheetModal({
  visible,
  onClose,
  children,
  maxHeight = '70%',
  height,
  glass = false,
  renderInPlace = false,
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  // Real, reported bug: a `KeyboardAvoidingView` inside this sheet's own
  // content didn't budge when the keyboard opened — RN's `Modal` presents in
  // its own native layer, and `KeyboardAvoidingView`'s automatic
  // `measureInWindow`-based sizing doesn't reliably track the keyboard from
  // inside one (a known RN/Modal limitation, not something padding/behavior
  // tuning fixes). Tracked here instead, driven straight off native keyboard
  // show/hide events, and folded into the sheet's own translateY below —
  // the whole sheet floats up bodily to stay above the keyboard, the same
  // way CommentsSheet wants its composer to "sit on top of the keyboard".
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animateTo = (toValue: number, duration?: number) => {
      Animated.timing(keyboardOffset, {
        toValue,
        duration: duration ?? 220,
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      animateTo(e.endCoordinates.height, e.duration);
    });
    const hideSub = Keyboard.addListener(hideEvent, (e: KeyboardEvent) => {
      animateTo(0, e.duration);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  if (!mounted) return null;

  const content = (
    <>
      {/* A tap anywhere outside the sheet closes it. */}
      <Pressable testID="bottom-sheet-backdrop" style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          glass && styles.glassSheet,
          {
            maxHeight,
            ...(height ? { height } : null),
            paddingBottom: Math.max(insets.bottom, spacing.lg),
            transform: [
              {
                translateY: Animated.add(
                  progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT, 0],
                  }),
                  Animated.multiply(keyboardOffset, -1),
                ),
              },
            ],
          },
        ]}
      >
        {glass ? (
          <>
            <GlassBackdrop />
            <GlassHighlight kind="sheet" cornerRadius={SHEET_RADIUS} />
          </>
        ) : null}
        {children}
      </Animated.View>
    </>
  );

  if (renderInPlace) {
    return <View style={StyleSheet.absoluteFill}>{content}</View>;
  }

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha(colors.ink, fillOpacity.dim),
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  // A glass sheet is see-through, with its own rim (the gradient one, so no hairline), and
  // clips its blur to the rounded top corners. (No shadow: `overflow: 'hidden'` would clip
  // it anyway.)
  glassSheet: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    shadowOpacity: 0,
    elevation: 0,
    ...glassRimmedStyle,
  },
});
