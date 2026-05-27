import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Stack as ExpoStack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Stack } from '../../components/layout/stack';
import { Text } from '../../components/ui/text';
import { IconButton } from '../../components/ui/iconButton';
import { ExploreChallengeCard } from '../../components/challenge/list/ExploreChallengeCard';
import type { ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import { getChallenges } from '../../services/challenge/challenge.service';
import { toChallengeListViewModel } from '../../services/adapters';
import { spacing } from '../../constants/theme';

export default function ExploreAll() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<ExploreChallengeViewModel[]>([]);

  useEffect(() => {
    getChallenges()
      .then((res) => {
        const vm = toChallengeListViewModel(res ?? [], {
          membersLabel: t('challenges.members'),
          unknownCreatorLabel: t('challenges.unknownCreator'),
          locationFallbackLabel: t('challenges.locationFallback'),
        });
        setChallenges(vm.exploreChallenges);
      })
      .catch(() => setError(t('challenges.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <ScreenBackground variant="challenges">
      <ExpoStack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
        <Text variant="title">{t('challenges.allExploreTitle')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#ffffff" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Stack gap="sm">
            {challenges.map((challenge) => (
              <ExploreChallengeCard
                key={challenge.challengeId}
                challenge={challenge}
                onPress={() => router.push(`/challenge/${challenge.challengeId}`)}
              />
            ))}
          </Stack>
        </ScrollView>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
