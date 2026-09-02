import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../constants/theme';

interface SpaceAvatarProps {
  /** Used for the placeholder's initial letter. */
  name: string;
  /** The space's own accent color (from `getSpaceAccentColor`) — the
   * placeholder's fill. Deliberately NOT a random/hashed color like
   * `UserAvatar`'s own placeholder: a space already has one real,
   * deliberately-chosen color (picked in `SpaceForm`), so there's nothing
   * to synthesize. */
  accentColor: string;
  imageUrl?: string | null;
  size?: number;
}

/**
 * A space's own circular avatar — spaces can't have a real profile photo
 * yet (no image-upload flow exists), so the placeholder follows the exact
 * same shape as `UserAvatar`'s own placeholder (an initial letter on a
 * colored circle) rather than a blank neutral fill, just filled with the
 * space's own assigned Activity Color instead of a per-user hash color.
 */
export function SpaceAvatar({ name, accentColor, imageUrl, size = 40 }: SpaceAvatarProps) {
  const initial = name ? name[0].toUpperCase() : '?';
  const fontSize = Math.round(size * 0.38);
  // Same flat `big` corner radius UserAvatar uses (not size/2) — see that
  // component's own note: small sizes still read as circles, a large one
  // (this screen's 72px preview hero) reads as a rounded square/"squircle"
  // instead, matching the rest of the app's avatar treatment either way.
  const cornerRadius = radius.big;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: cornerRadius }}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: cornerRadius, backgroundColor: accentColor },
      ]}
    >
      {/* `ink`, not `paper` — every activityColors entry (and the neutral
          `colors.primary` fallback `getSpaceAccentColor` itself falls back
          to) is documented as pairing with `ink` text only. */}
      <Text style={{ fontSize, fontWeight: '700', color: colors.ink, lineHeight: fontSize * 1.3 }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
