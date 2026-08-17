import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing } from '../../constants/theme';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  bio?: string | null;
  imageUrl?: string | null;
  /** Omit either count to hide the stats row entirely. */
  followersCount?: number;
  followingCount?: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
  /** Optional action buttons rendered under the identity block (e.g. Edit profile). */
  actions?: React.ReactNode;
}

function StatItem({ count, label }: { count: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="header" tone="primary">{count}</Text>
      <Text variant="caption" tone="secondary">{label}</Text>
    </View>
  );
}

export function ProfileHeader({
  displayName,
  username,
  bio,
  imageUrl,
  followersCount,
  followingCount,
  onPressFollowers,
  onPressFollowing,
  actions,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const showStats = followersCount !== undefined && followingCount !== undefined;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <UserAvatar username={username} imageUrl={imageUrl} size={90} />
        <View style={styles.info}>
          <Text variant="title">{displayName}</Text>
          <Text variant="body" tone="secondary">@{username}</Text>

          {showStats && (
            <Row gap="lg" justify="flex-start" style={styles.stats}>
              <Pressable onPress={onPressFollowers} disabled={!onPressFollowers} hitSlop={8}>
                <StatItem count={followersCount} label={t('follows.followersLabel')} />
              </Pressable>
              <Pressable onPress={onPressFollowing} disabled={!onPressFollowing} hitSlop={8}>
                <StatItem count={followingCount} label={t('follows.followingLabel')} />
              </Pressable>
            </Row>
          )}
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
  stats: {
    marginTop: spacing.xs,
  },
  stat: {
    gap: 2,
  },
});
