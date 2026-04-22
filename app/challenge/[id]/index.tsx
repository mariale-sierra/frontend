import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import ScreenBackground from '../../../components/layout/screenBackground';

import {
  sanitizeChallengeOptions,
  getChallengeDetailById,
} from '../../../services/adapters/metricsAdapter';

import ChallengeHeader from '../../../components/challengesInfo/challengeHeader';
import ChallengeRules from '../../../components/challengesInfo/challengeRules';
import ChallengeRoutineList from '../../../components/challengesInfo/challengeRoutineList';

import { spacing } from '../../../constants/theme';

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams();

  const challenges = sanitizeChallengeOptions([
    {
      id: 'c1',
      label: 'Seventy-five hard challenge',
      activityCategories: ['Strength', 'Cardio Low'],
      locations: ['gym', 'outdoor'],
    },
  ]);

  const challenge = challenges.find((c) => c.id === id) || challenges[0];
  const detail = getChallengeDetailById(challenge.id);

  if (!detail) return null;

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <ChallengeHeader challenge={challenge} detail={detail} />
        <ChallengeRules rules={detail.rules} />
        <ChallengeRoutineList routine={detail.routine} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing['2xl'],
  },
});