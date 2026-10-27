import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageResizeMode,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fillOpacity, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface LoadingImageProps {
  uri: string;
  /** Size and place the image through this (it fills it). */
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  /** On the image itself; the loader gets `${testID}-loading`. */
  testID?: string;
}

/**
 * A remote image that shows it is loading (Sprint 10: challenge photos took a
 * few seconds and sat black meanwhile): the skeleton fill with a spinner until
 * the image finishes — or fails, so a broken URL never spins forever.
 */
export function LoadingImage({ uri, style, resizeMode = 'cover', testID }: LoadingImageProps) {
  const [loading, setLoading] = useState(true);

  // A new photo starts loading again.
  useEffect(() => {
    setLoading(true);
  }, [uri]);

  return (
    <View style={style}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        onLoadEnd={() => setLoading(false)}
        testID={testID}
      />
      {loading ? (
        <View style={styles.loader} pointerEvents="none" testID={testID ? `${testID}-loading` : undefined}>
          <ActivityIndicator color={withAlpha(colors.paper, textOpacity.secondary)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // The same fill as `Skeleton`, so it reads as the app's loading state.
  loader: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.paper, fillOpacity.subtle),
  },
});
