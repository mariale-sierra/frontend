import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import type { DimensionValue } from 'react-native';
import { colors, radius } from '../../constants/theme';

// Until the image's own proportions are known, and how far from square they may
// run: a very tall or very wide picture still fits (it is letterboxed), it just
// doesn't make the screen all image.
const DEFAULT_ASPECT_RATIO = 4 / 3;
const MIN_ASPECT_RATIO = 3 / 4;
const MAX_ASPECT_RATIO = 16 / 9;

interface ExercisePictureProps {
  uri: string;
  /** How wide the picture is drawn, as a share of its container's width. A picture
   * narrower than its container is centered in it. Default: the whole width. */
  width?: DimensionValue;
}

/**
 * The exercise's picture, shown WHOLE: the frame takes the picture's own proportions
 * and the picture is contained in it, never cropped to a fixed-height box (which cut
 * off the top or bottom of the exercise).
 */
export function ExercisePicture({ uri, width = '100%' }: ExercisePictureProps) {
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);

  useEffect(() => {
    let active = true;
    Image.getSize(
      uri,
      (imageWidth, imageHeight) => {
        if (active && imageWidth > 0 && imageHeight > 0) {
          setAspectRatio(Math.min(Math.max(imageWidth / imageHeight, MIN_ASPECT_RATIO), MAX_ASPECT_RATIO));
        }
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [uri]);

  return <Image source={{ uri }} style={[styles.image, { aspectRatio, width }]} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
    // The small radius: photo tiles are always this one.
    borderRadius: radius.small,
    backgroundColor: colors.surface,
  },
});
