import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

// Neutral placeholder fill (paper @ 20% over the ink screen background) — the
// value the wireframes use for avatar/photo placeholder circles. Not yet a
// formal design-system token; see havit-design-system-SKILL.md Open Items
// Tracker → "neutral fill-wash opacities".
const AVATAR_PLACEHOLDER_FILL = withAlpha(colors.paper, 0.2);

interface UserAvatarProps {
  username: string;
  size?: number;
  /** Optional profile photo URL — falls back to the initial when absent. */
  imageUrl?: string | null;
}

export function UserAvatar({ username, size = 40, imageUrl }: UserAvatarProps) {
  const initial = username ? username[0].toUpperCase() : '?';
  const fontSize = Math.round(size * 0.38);
  // Corner radius is always the flat `big` token, not size/2 — confirmed by
  // both the Home and Profile wireframes. Small avatars still read as
  // circles (28px exceeds half their own width/height, so the platform
  // clamps it into a full circle), while the large profile avatar (88px)
  // deliberately shows as a rounded square/"squircle" instead of a circle.
  const cornerRadius = radius.big;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: cornerRadius }}
        accessibilityLabel={username}
      />
    );
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: cornerRadius }]}>
      <Text style={{ fontSize, fontWeight: '700', color: colors.paper, lineHeight: fontSize * 1.3 }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    // Neutral fill for every user — the old per-user rainbow hash reused the
    // retired per-activity color palette. See design system → Explicitly
    // Rejected Patterns.
    backgroundColor: AVATAR_PLACEHOLDER_FILL,
  },
});
