import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Divider } from '../../components/ui/divider';
import { ConversationListItem } from '../../components/chats/ConversationListItem';
import { useConversations } from '../../hooks/useConversations';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing } from '../../constants/theme';

export default function Messaging() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const { conversations, loading, error, reload } = useConversations();

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Text variant="title">{t('chats.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('chats.loadError')}</Text>
          <Button variant="outline" size="sm" onPress={reload}>
            {t('common.actions.continue')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              currentUserId={userId}
              onPress={() =>
                router.push({
                  pathname: '/messaging/[conversationId]',
                  params: {
                    conversationId: item.id,
                    otherUsername: item.otherParticipant.username,
                    otherDisplayName: item.otherParticipant.displayName ?? '',
                    otherProfileImageUrl: item.otherParticipant.profileImageUrl ?? '',
                  },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <Divider marginVertical="xs" />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="secondary">{t('chats.emptyState')}</Text>
            </View>
          }
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
