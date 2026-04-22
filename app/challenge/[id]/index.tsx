import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import ScreenBackground from '../../../components/layout/screenBackground';
import ChallengeHeader from '../../../components/challengesInfo/challengeHeader';
import ChallengeRules from '../../../components/challengesInfo/challengeRules';
import ChallengeRoutineList from '../../../components/challengesInfo/challengeRoutineList';
import { spacing } from '../../../constants/theme';
import { getChallenge } from '../../../services/challenge.service';

type BackendChallenge = {
  id: string;
  name: string;
  description?: string;
  visibility: string;
  duration_days: number;
  created_by_user_id: string;
};

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<BackendChallenge | null>(null);
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
          detail={{ author: 'member', days: challenge.duration_days }}
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
