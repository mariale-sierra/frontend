import { StyleSheet, View } from 'react-native';
import { spacing } from '../../constants/theme';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
}

export function ProfileHeader({ displayName, username }: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <UserAvatar username={username} size={90} />
      <View style={styles.info}>
        <Text variant="title">{displayName}</Text>
        <Text variant="body" tone="secondary">@{username}</Text>
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
  info: {
    flex: 1,
    gap: 2,
  },
});
