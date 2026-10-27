import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LoadingImage } from '../../ui/loadingImage';
import { Icon } from '../../ui/icon';
import { colors, radius, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface ChallengeCoverTileProps {
  /** The approved photo; `null` shows the placeholder. */
  imageUrl: string | null | undefined;
  /** A square of this side. Leave it out and size the tile through `style`
   * (the info screen's full-width header). */
  size?: number;
  /** The placeholder icon's size; defaults to a quarter of `size`. */
  iconSize?: number;
  /** Tilt in degrees — the Explore card's photo leans a little (wireframe). */
  rotateDeg?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The challenge photo (Sprint 10): a rounded square, cover-fit. Until a photo
 * passes moderation — or when the challenge has none — it is a gray tile with
 * an image icon, the same for everyone.
 */
export function ChallengeCoverTile({ imageUrl, size, iconSize, rotateDeg = 0, style, testID }: ChallengeCoverTileProps) {
  const tile = [
    styles.tile,
    size ? { width: size, height: size } : null,
    rotateDeg ? { transform: [{ rotate: `${rotateDeg}deg` }] } : null,
    style,
  ];

  if (imageUrl) {
    return (
      <View style={tile} testID={testID}>
        <LoadingImage uri={imageUrl} style={styles.image} testID={testID ? `${testID}-image` : undefined} />
      </View>
    );
  }

  return (
    <View style={[tile, styles.placeholder]} testID={testID ? `${testID}-placeholder` : undefined}>
      <Icon
        name="image-outline"
        size={iconSize ?? Math.round((size ?? 160) * 0.26)}
        color={withAlpha(colors.paper, textOpacity.tertiary)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.medium,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: withAlpha(colors.neutral, 0.28),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
