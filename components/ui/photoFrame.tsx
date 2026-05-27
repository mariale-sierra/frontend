import { Image, StyleSheet, View } from 'react-native';
import { Icon } from './icon';
import { PhotoUserOverlay } from './photoUserOverlay';
import { colors } from '../../constants/theme';

interface PhotoFrameProps {
  imageUrl?: string;
  username: string;
}

export function PhotoFrame({ imageUrl, username }: PhotoFrameProps) {
  return (
    <View style={styles.frame}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="image-outline" size={42} color="rgba(255,255,255,0.3)" />
        </View>
      )}
      <PhotoUserOverlay username={username} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
