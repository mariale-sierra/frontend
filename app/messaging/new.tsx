import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { getOrCreateConversation } from '../../services/chats/chats.service';
import { colors, spacing } from '../../constants/theme';

/**
 * Entry point for starting a 1:1 conversation from anywhere else in the app:
 * `router.push({ pathname: '/messaging/new', params: { recipientUserId } })`.
 * Resolves (or reuses) the conversation, then hands off to the real thread
 * screen — nothing renders here beyond a brief loading/error state.
 */
export default function NewConversation() {
  const { t } = useTranslation();
  const router = useRouter();
  const { recipientUserId } = useLocalSearchParams<{ recipientUserId: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!recipientUserId) {
      setError(true);
      return;
    }

    let cancelled = false;
    getOrCreateConversation(recipientUserId)
      .then((conversation) => {
        if (cancelled) return;
        router.replace({
          pathname: '/messaging/[conversationId]',
          params: {
            conversationId: conversation.id,
            otherUsername: conversation.otherParticipant.username,
            otherDisplayName: conversation.otherParticipant.displayName ?? '',
            otherProfileImageUrl: conversation.otherParticipant.profileImageUrl ?? '',
          },
        });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [recipientUserId, router]);

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
      </View>
      <View style={styles.center}>
        {error ? (
          <Text tone="secondary">{t('chats.startConversationError')}</Text>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text tone="secondary">{t('chats.startingConversation')}</Text>
          </>
        )}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
