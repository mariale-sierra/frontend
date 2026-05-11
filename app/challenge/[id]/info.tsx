import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from '../../../components/ui/text';
import { spacing } from '../../../constants/theme';
import { getChallenge } from '../../../services/challenge/challenge.service';
import type { ChallengeContract } from '../../../types/challenge';
import { useTranslation } from 'react-i18next';

export default function ChallengeInfo() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    getChallenge(id)
      .then(setChallenge)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text variant="body">
          {t('common.errors.genericTitle')}
        </Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text variant="body">
          {t('challenges.notFound', { defaultValue: 'Challenge not found.' })}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="title">{challenge.name}</Text>
      {challenge.description ? (
        <Text variant="body" style={styles.description}>{challenge.description}</Text>
      ) : null}
      {challenge.duration_days ? (
        <Text variant="caption" style={styles.meta}>
          {t('challenges.durationDays', { count: challenge.duration_days, defaultValue: '{{count}} days' })}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  description: {
    marginTop: spacing.sm,
    opacity: 0.85,
  },
  meta: {
    marginTop: spacing.xs,
    opacity: 0.6,
  },
});
