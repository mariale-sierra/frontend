import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import ScreenBackground from '../../components/layout/screenBackground';
import { Stack } from '../../components/layout/stack';
import {
  ChallengeConfigurationSection,
  ChallengeDaysList,
  ChallengeSubmitActions,
  ChallengeTitleInputs,
  ChallengeVisibilitySection,
  CreateChallengeHeader,
  DurationStepper,
} from '../../components/create';
import { ChallengeSectionHeader } from '../../components/create/ChallengeSectionHeader';
import { Text } from '../../components/ui/text';
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
  const hasChallengeIdentity = title.trim().length > 0 && description.trim().length > 0;

  const hasRoutineForEveryDay = useMemo(
    () => Array.from({ length: duration }, (_, index) => index + 1)
      .every((dayNumber) => Boolean(routinesByDay[dayNumber])),
    [duration, routinesByDay],
  );

  const isSetupComplete = selectedCategories.length > 0 && selectedLocations.length > 0;

  const effectiveChallengeDuration = challengeDurationOverride ?? duration;

  const isFormComplete = hasChallengeIdentity
    && selectedCategories.length > 0
    && selectedLocations.length > 0
    && duration > 0
    && hasRoutineForEveryDay
    && effectiveChallengeDuration > 0
    && Boolean(visibility);

  const missingConfigurationFields = useMemo(() => {
    const missing: string[] = [];

    if (title.trim().length === 0) missing.push('Challenge title');
    if (description.trim().length === 0) missing.push('Challenge description');
    if (selectedCategories.length === 0) missing.push('Exercise categories');
    if (selectedLocations.length === 0) missing.push('Challenge location');
    if (duration <= 0) missing.push('Cycle duration');
    if (!hasRoutineForEveryDay) missing.push('Routine selection for each day');
    if (effectiveChallengeDuration <= 0) missing.push('Challenge duration');
    if (!visibility) missing.push('Visibility');

    return missing;
  }, [
    title,
    description,
    selectedCategories,
    selectedLocations,
    duration,
    hasRoutineForEveryDay,
    effectiveChallengeDuration,
    visibility,
  ]);

  function handleActionPress(actionLabel: string) {
    if (missingConfigurationFields.length > 0) {
      Alert.alert(
        'Missing configuration',
        `Before "${actionLabel}", please complete:\n\n${missingConfigurationFields.map((item) => `• ${item}`).join('\n')}`,
      );
      return;
    }

    Alert.alert('Ready to go', `"${actionLabel}" is ready. Hook up the final flow next.`);
  }

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

          <ChallengeSectionHeader title="1. SETUP" />

          <ChallengeConfigurationSection
            categories={CATEGORY_OPTIONS}
            locations={LOCATION_OPTIONS}
          />

          <ChallengeSectionHeader title="2. YOUR PLAN" style={styles.planSection} />

          {isSetupComplete ? (
            <>
          <DurationStepper
            label="Cycle Duration"
            value={duration}
            onIncrement={() => setDuration((d) => d + 1)}
            onDecrement={() => setDuration((d) => Math.max(1, d - 1))}
          />

          <ChallengeDaysList days={duration} />

          <ChallengeVisibilitySection
            challengeDuration={effectiveChallengeDuration}
            visibilityOptions={VISIBILITY_OPTIONS}
            selectedVisibility={visibility}
            onChangeChallengeDuration={(value) => setChallengeDurationOverride(value > 0 ? value : null)}
            onChangeVisibility={setVisibility}
          />
            </>
          ) : (
            <Text variant="caption" style={styles.gateHint}>
              Select your activity categories and location to continue building your plan.
            </Text>
          )}

          <View style={styles.actionsBlock}>
            <ChallengeSubmitActions
              visibility={normalizedVisibility ?? 'Public'}
              onPrimaryPress={() => handleActionPress(normalizedVisibility === 'Private' ? 'Start Challenge' : 'Publish & Join')}
              onSendToFriendsPress={() => handleActionPress('Send to Friends')}
              onSaveForLaterPress={() => handleActionPress('Save for Later')}
            />

            {!isFormComplete && (
              <Text variant="caption" style={styles.actionsHint}>
                Complete all required fields to publish, share, or save this challenge.
              </Text>
            )}
          </View>
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
  planSection: {
    marginTop: spacing.md,
  },
  gateHint: {
    textAlign: 'center',
    opacity: 0.45,
    paddingVertical: spacing.md,
  },
  actionsBlock: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  actionsHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.62)',
  },
});