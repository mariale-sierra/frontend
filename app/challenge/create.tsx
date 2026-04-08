import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from '../../components/layout/stack';
import {
  ChallengeConfigurationSection,
  ChallengeDaysList,
  ChallengeTitleInputs,
  ChallengeVisibilitySection,
  CreateChallengeHeader,
} from '../../components/create';
import { colors, spacing } from '../../constants/theme';

const CATEGORY_OPTIONS = [
  'Strength',
  'Cardio Intense',
  'Cardio Low',
  'Flexibility',
  'Mind-Body',
  'Functional',
];
const LOCATION_OPTIONS = ['Gym', 'Home', 'Outdoor', 'Studio', 'Anywhere'];
const VISIBILITY_OPTIONS = ['Public', 'Private'];

export default function CreateChallenge() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(3);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack gap="md">
        <CreateChallengeHeader author="Cami" />

        <ChallengeTitleInputs
          title={title}
          description={description}
          onChangeTitle={setTitle}
          onChangeDescription={setDescription}
        />

        <ChallengeConfigurationSection
          categories={CATEGORY_OPTIONS}
          locations={LOCATION_OPTIONS}
          duration={duration}
          onChangeDuration={setDuration}
        />

        <ChallengeDaysList days={duration} />

        <ChallengeVisibilitySection
          duration={duration}
          visibilityOptions={VISIBILITY_OPTIONS}
        />
      </Stack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
    backgroundColor: colors.surface,
    flexGrow: 1,
  },
});