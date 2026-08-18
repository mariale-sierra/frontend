import { StyleSheet, View } from 'react-native';
import { spacing } from '../../constants/theme';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  bio?: string | null;
  imageUrl?: string | null;
  /** Optional action buttons rendered under the identity block (e.g. Edit profile). */
  actions?: React.ReactNode;
}

export function ProfileHeader({ displayName, username, bio, imageUrl, actions }: ProfileHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <UserAvatar username={username} imageUrl={imageUrl} size={90} />
        <View style={styles.info}>
          <Text variant="title">{displayName}</Text>
          <Text variant="body" tone="secondary">@{username}</Text>
        </View>
      </View>
      {bio ? (
        <Text variant="body" tone="secondary">
          {bio}
        </Text>
      ) : null}
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
