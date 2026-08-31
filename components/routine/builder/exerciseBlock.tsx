import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ExerciseMetricsEditor } from '../metrics/exerciseMetricsEditor';
import { ExerciseHeader } from './exerciseHeader';
import { colors, radius } from '../../../constants/theme';
import type { ExerciseEntry } from '../../../types/routine';

interface ExerciseBlockProps {
  exercise: ExerciseEntry;
  index: number;
}

/** One exercise card in the Builder step — its own `surface` bg + `medium`
 * radius (List-row card, Components → Card variants), not a shared divided
 * list. Cards are spaced via the parent Stack's own `gap`, not a divider. */
export function ExerciseBlock({ exercise, index }: ExerciseBlockProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <View style={styles.card}>
      <ExerciseHeader
        exercise={exercise}
        index={index}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        onRemoveExerciseId={exercise.id}
      />

      {!collapsed ? <ExerciseMetricsEditor exercise={exercise} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    overflow: 'hidden',
  },
});
