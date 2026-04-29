import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import ScreenBackground from '../../../components/layout/screenBackground';
import ChallengeHeader from '../../../components/challengesInfo/challengeHeader';
import ChallengeRules from '../../../components/challengesInfo/challengeRules';
import ChallengeRoutineList from '../../../components/challengesInfo/challengeRoutineList';
import { spacing } from '../../../constants/theme';
import { getChallenge } from '../../../services/challenge/challenge.service';
import type { ChallengeContract } from '../../../types/challenge';
import { useTranslation } from 'react-i18next';

export default function ChallengeDetail() {
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
      <ScreenBackground>
        <View style={styles.center}>
          <ActivityIndicator color="#ffffff" />
        </View>
      </ScreenBackground>
    );
  }

  if (error || !challenge) return null;

  const rules = challenge.description ? [challenge.description] : [];

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <ChallengeHeader
          challenge={{ label: challenge.name }}
          detail={{ author: t('challenges.memberAuthor'), days: challenge.duration_days ?? 0 }}
        />
        <ChallengeRules rules={rules} />
        <ChallengeRoutineList routine={[]} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing['2xl'],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
