import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const ANIM_DURATION = 260;

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Passed straight through to the sheet's own `maxHeight` style. */
  maxHeight?: `${number}%`;
}

/** Shared bottom-sheet shell for the exercise filter sheets (categories,
 * locations, muscles). The dark backdrop and the sheet are two SEPARATE
 * animated layers — backdrop fades opacity 0->1 in place, sheet slides via
 * `translateY` — rather than one native `Modal animationType="slide"`
 * transition. That native transition moves the whole modal content
 * together, which visibly dragged the backdrop up from the bottom along
 * with the sheet (real reported bug). Both layers are absolutely
 * positioned so neither depends on Modal's default flex stacking. */
export function BottomSheetModal({ visible, onClose, children, maxHeight = '70%' }: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

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

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [SCREEN_HEIGHT, 0],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha('#000000', 0.5),
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.big,
    borderTopRightRadius: radius.big,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
});
