import type { ComponentProps } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

const CHIP_ICON_SIZE = 19;

export type CameraPostVisibility = 'followers' | 'private';

/** A chip over the captured photo — an icon and a label in a dark, rimmed pill: the
 * visibility toggle (top right) and, for a challenge's owner, the tag picker (top left)
 * are both this one, so they cannot drift apart. `style` places it; `scale` lets it pulse. */
export function CameraChip({
  icon,
  label,
  onPress,
  style,
  scale,
  testID,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  scale?: Animated.Value;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [style, pressed && styles.pressed]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <Animated.View style={[styles.chipInner, scale && { transform: [{ scale }] }]}>
        <Icon name={icon} size={CHIP_ICON_SIZE} color={colors.paper} />
        <Text style={styles.chipLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** Followers / private switch for the photo, pinned to the top right of the frame. */
export function VisibilityToggle({
  visibility,
  anim,
  onToggle,
}: {
  visibility: CameraPostVisibility;
  anim: Animated.Value;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const isFollowers = visibility === 'followers';
  return (
    <CameraChip
      icon={isFollowers ? 'eye-outline' : 'eye-off-outline'}
      label={isFollowers ? t('camera.visibilityFollowers') : t('camera.visibilityPrivate')}
      onPress={onToggle}
      style={styles.visibilityToggle}
      scale={anim}
      testID="camera-visibility-toggle"
    />
  );
}

const styles = StyleSheet.create({
  visibilityToggle: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    // Legacy radius.xl (18) — nearest current token is `medium` (16).
    borderRadius: radius.medium,
    backgroundColor: withAlpha(colors.ink, 0.45),
    borderWidth: 1,
    borderColor: withAlpha(colors.paper, 0.18),
  },
  // No `opacity: 1` alongside this custom color, unlike the usual rule for
  // Text custom-color overrides — kept exactly as shipped (already rendering
  // at the tone's default 85%) per an explicit "don't change this visually" request.
  chipLabel: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.8,
  },
});
