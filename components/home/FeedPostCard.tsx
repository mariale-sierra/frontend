import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PhotoFrame } from '../ui/photoFrame';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';

interface FeedPostCardProps {
  post: FeedPostViewModel;
}

export function FeedPostCard({ post }: FeedPostCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  // Messaging isn't implemented yet — app/messaging/[conversationId].tsx is
  // still a placeholder screen, and post.userId is used as a stand-in for a
  // real conversationId. Swap this once a real conversations endpoint exists.
  function handleSendMessage() {
    router.push(`/messaging/${post.userId}`);
  }

  return (
    <View style={styles.card}>
      <PhotoFrame imageUrl={post.imageUrl} username={post.userName} />

      <View style={styles.footer}>
        {post.caption ? (
          <Text variant="body" numberOfLines={2} style={styles.caption}>
            {post.caption}
          </Text>
        ) : null}

        <Row justify="space-between" align="center">
          <Row gap="xs">
            <Icon name="heart-outline" size={14} color={colors.textSecondary} />
            <Text variant="caption">{post.likesCount}</Text>
            <Text variant="caption">{`· ${post.postedAt}`}</Text>
          </Row>

          <Row pressable onPress={handleSendMessage} gap="xs">
            <Icon name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text variant="caption">{t('home.sendMessage')}</Text>
          </Row>
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  footer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  caption: {
    color: colors.textPrimary,
  },
});
