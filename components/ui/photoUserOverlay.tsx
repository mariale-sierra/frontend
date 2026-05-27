import { StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from './userAvatar';
import { spacing } from '../../constants/theme';

interface PhotoUserOverlayProps {
  username: string;
}

export function PhotoUserOverlay({ username }: PhotoUserOverlayProps) {
  return (
    <View style={styles.overlay}>
      <UserAvatar username={username} size={26} />
      <Text style={styles.username}>{username}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 16,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
