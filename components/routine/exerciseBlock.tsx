import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from '../layout/stack';
import { ExerciseMetricsEditor } from './exerciseMetricsEditor';
import { ExerciseHeader } from './exerciseHeader';
import { ExerciseNoteField } from './exerciseNoteField';
import { routineStyles } from './routineStyles';
import { useRoutineBuilder } from '../../store/routineBuilderStore';
import { colors, spacing } from '../../constants/theme';
import type { ExerciseEntry } from '../../types/routine';

interface ExerciseBlockProps {
  exercise: ExerciseEntry;
  index: number;
}

export function ExerciseBlock({ exercise, index }: ExerciseBlockProps) {
  const { setNote, removeExercise } = useRoutineBuilder();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <View style={styles.container}>
      {index > 0 ? <View style={routineStyles.divider} /> : null}
      <Stack gap="sm">
        <ExerciseHeader
          exercise={exercise}
          index={index}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          onRemove={() => removeExercise(exercise.id)}
        />

        {!collapsed ? (
          <>
            <ExerciseMetricsEditor exercise={exercise} />

            <ExerciseNoteField value={exercise.note} onChangeText={(text) => setNote(exercise.id, text)} />
          </>
        ) : null}
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
});