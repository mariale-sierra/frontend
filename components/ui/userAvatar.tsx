import { Image, StyleSheet, Text, View } from 'react-native';
import { activityColors, colors, fillOpacity, radius } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

// Fallback only for the (rare) case there's no username at all yet to hash —
// same neutral fill this whole placeholder used to always be. Real formal
// design-system token (`fillOpacity.placeholder`) — see
// havit-design-system-SKILL.md Open Items Tracker → "neutral fill-wash
// opacities".
const AVATAR_PLACEHOLDER_FILL = withAlpha(colors.paper, fillOpacity.placeholder);

// Per explicit request, reintroducing what the design system doc calls out
// as a previously-retired pattern ("the old per-user rainbow hash reused
// the retired per-activity color palette") — now a deliberate, confirmed
// exception, not a regression. Recorded in havit-design-system-SKILL.md.
const PLACEHOLDER_COLORS = Object.values(activityColors);

/**
 * Deterministic, not random-per-render: the same username always lands on
 * the same color, so a user's avatar stays visually consistent everywhere
 * it's shown — across screens, across sessions — without needing any
 * backend change to assign/persist a color at signup. A plain string hash
 * (no need for anything crypto-grade) mapped onto the real
 * `activityColors` palette, the only colors this reuses.
 */
function colorForUsername(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) | 0;
  }
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

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

  const placeholderColor = username ? colorForUsername(username) : AVATAR_PLACEHOLDER_FILL;

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: cornerRadius, backgroundColor: placeholderColor }]}>
      {/* `ink`, not `paper` — every `activityColors` entry is documented as
          pairing with `ink` text only (6:1+ contrast), never white/paper.
          The old neutral-fill fallback paired fine with `paper`, but that's
          no longer what's usually behind this text. */}
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
