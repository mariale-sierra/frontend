import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import type { ComponentProps } from 'react';
import { colors, spacing } from '../../constants/theme';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';

interface ActionButtonProps extends Omit<PressableProps, 'children'> {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
}

function ActionButton({ icon, label, ...props }: ActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
      {...props}
    >
      <Icon name={icon} size={14} color={colors.textPrimary} />
      <Text variant="label" style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  onShare?: () => void;
  onMessage?: () => void;
}

export function ProfileHeader({ displayName, username, onShare, onMessage }: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Icon name="person" size={38} color={colors.textPrimary} />
      </View>
      <View style={styles.info}>
        <Text variant="title">{displayName}</Text>
        <Text variant="body" tone="secondary">@{username}</Text>
        <View style={styles.actions}>
          <ActionButton icon="share-social-outline" label="Share" onPress={onShare} />
          <ActionButton icon="send-outline" label="Message" onPress={onMessage} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
});
