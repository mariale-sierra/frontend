import { useState, type ReactNode } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { radius } from '../../constants/theme';
import { Row } from '../layout/row';
import { Skeleton } from './skeleton';

/** Roughly a small pill button's height (Button `sm`, AccentPill). */
const ACTION_SKELETON_HEIGHT = 34;
const ACTION_SKELETON_WIDTH = 112;
const LABEL_SKELETON_HEIGHT = 14;

interface IllustratedBlockProps {
  source: ImageSourcePropType;
  /** The illustration square's side. */
  size: number;
  /** What goes under the illustration: the label and the buttons. */
  children?: ReactNode;
  /** How many pill buttons `children` has, so the skeleton matches. */
  actionCount?: number;
  /** The block's layout (alignment, gap, padding) — shared with the skeleton. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** On the image itself; the skeleton gets `${testID}-skeleton`. */
  imageTestID?: string;
}

/**
 * Sprint 10: an empty-state block (illustration, label, buttons) that shows as
 * a skeleton until the illustration has loaded, then appears all at once — not
 * the text first and the picture popping in after. The real content is laid
 * out underneath (invisible) so the image loads and the height never jumps.
 */
export function IllustratedBlock({
  source,
  size,
  children,
  actionCount = 0,
  style,
  testID,
  imageTestID,
}: IllustratedBlockProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View testID={testID}>
      <View
        style={[style, !loaded && styles.hidden]}
        pointerEvents={loaded ? 'auto' : 'none'}
        accessibilityElementsHidden={!loaded}
        importantForAccessibility={loaded ? 'auto' : 'no-hide-descendants'}
      >
        <Image
          source={source}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onLoadEnd={() => setLoaded(true)}
          accessibilityIgnoresInvertColors
          testID={imageTestID}
        />
        {children}
      </View>
      {!loaded ? (
        <View
          style={[style, StyleSheet.absoluteFill]}
          pointerEvents="none"
          testID={imageTestID ? `${imageTestID}-skeleton` : undefined}
        >
          <Skeleton width={size} height={size} radius={radius.big} />
          <Skeleton width={size * 1.4} height={LABEL_SKELETON_HEIGHT} />
          {actionCount > 0 ? (
            <Row gap="sm" justify="center">
              {Array.from({ length: actionCount }, (_, i) => (
                <Skeleton key={i} width={ACTION_SKELETON_WIDTH} height={ACTION_SKELETON_HEIGHT} radius={radius.big} />
              ))}
            </Row>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
});
