import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from '../layout/stack';
import { ExerciseSetTable } from './exerciseSetTable';
import { ExerciseHeader } from './exerciseHeader';
import { routineStyles } from './routineStyles';
import { spacing } from '../../constants/theme';
import type { ExerciseEntry } from '../../types/routine';

interface ExerciseBlockProps {
  exercise: ExerciseEntry;
  index: number;
}

export function ExerciseBlock({ exercise, index }: ExerciseBlockProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <View style={styles.container}>
      {index > 0 ? <View style={routineStyles.divider} /> : null}
      <Stack gap="sm">
        <ExerciseHeader
          exercise={exercise}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          onRemoveExerciseId={exercise.id}
        />

        {!collapsed ? (
          <ExerciseSetTable exercise={exercise} />
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