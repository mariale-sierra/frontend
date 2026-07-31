import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

export function getUserAvatarColor(username: string): string {
  const palette = Object.values(colors.activityType) as string[];
  if (!username) return palette[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

interface UserAvatarProps {
  username: string;
  size?: number;
  /** Optional profile photo URL — falls back to the initial when absent. */
  imageUrl?: string | null;
}

export function UserAvatar({ username, size = 40, imageUrl }: UserAvatarProps) {
  const bgColor = getUserAvatarColor(username);
  const initial = username ? username[0].toUpperCase() : '?';
  const fontSize = Math.round(size * 0.38);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        accessibilityLabel={username}
      />
    );
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
      <Text style={{ fontSize, fontWeight: '700', color: '#000', lineHeight: fontSize * 1.3 }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
});
