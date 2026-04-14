import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import ScreenBackground from '../../components/layout/screenBackground';
import { Stack } from '../../components/layout/stack';
import {
  ChallengeConfigurationSection,
  ChallengeDaysList,
  ChallengeSubmitActions,
  ChallengeTitleInputs,
  ChallengeVisibilitySection,
  CreateChallengeHeader,
} from '../../components/create';
import { spacing } from '../../constants/theme';
import { useChallengeBuilder } from '../../store/challengeBuilderStore';
import { useRoutineBuilder } from '../../store/routineBuilderStore';

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
  const [challengeDurationOverride, setChallengeDurationOverride] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<string | null>(null);

  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);
  const routinesByDay = useRoutineBuilder((state) => state.routinesByDay);

  const hasRoutineForEveryDay = useMemo(
    () => Array.from({ length: duration }, (_, index) => index + 1)
      .every((dayNumber) => Boolean(routinesByDay[dayNumber])),
    [duration, routinesByDay],
  );

  const effectiveChallengeDuration = challengeDurationOverride ?? duration;

  const isFormComplete = selectedCategories.length > 0
    && selectedLocations.length > 0
    && duration > 0
    && hasRoutineForEveryDay
    && effectiveChallengeDuration > 0
    && Boolean(visibility);

  const normalizedVisibility = visibility?.toLowerCase() === 'private'
    ? 'Private'
    : visibility?.toLowerCase() === 'public'
      ? 'Public'
      : null;

  return (
    <ScreenBackground variant="top">
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
            challengeDuration={effectiveChallengeDuration}
            visibilityOptions={VISIBILITY_OPTIONS}
            selectedVisibility={visibility}
            onChangeChallengeDuration={(value) => setChallengeDurationOverride(value > 0 ? value : null)}
            onChangeVisibility={setVisibility}
          />

          {isFormComplete && normalizedVisibility && (
            <View style={styles.actionsBlock}>
              <ChallengeSubmitActions visibility={normalizedVisibility} />
            </View>
          )}
        </Stack>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  actionsBlock: {
    marginTop: spacing.xl,
  },
});