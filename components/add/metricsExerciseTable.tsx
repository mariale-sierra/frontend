import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, TextInput, View } from 'react-native';
import { ActivityIcon } from '../icons/activityIcon';
import { Text } from '../ui/text';
import { colors, gradients, spacing, typography } from '../../constants/theme';
import type { ExerciseMetricsBlock, MetricField } from '../../types/metrics';

interface MetricsExerciseTableProps {
  exercise: ExerciseMetricsBlock;
  index: number;
  activeRowKey: string | null;
  onRowFocus: (rowKey: string) => void;
  onRowBlur: (rowKey: string) => void;
  onMetricChange: (exerciseId: string, rowIndex: number, field: MetricField, value: string) => void;
  onNotesChange: (exerciseId: string, notes: string) => void;
}

interface MetricValueInputProps {
  value: string;
  rowKey: string;
  onFocus: (rowKey: string) => void;
  onBlur: (rowKey: string) => void;
  onChangeText: (value: string) => void;
}

const METRIC_COLUMNS: Array<{ key: MetricField; label: string }> = [
  { key: 'reps', label: 'reps' },
  { key: 'lbs', label: 'lbs' },
];

const TABLE_COLUMNS = ['set', ...METRIC_COLUMNS.map((column) => column.label)];

function MetricValueInput({ value, rowKey, onFocus, onBlur, onChangeText }: MetricValueInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={() => onFocus(rowKey)}
      onBlur={() => onBlur(rowKey)}
      keyboardType="numeric"
      placeholder="0"
      placeholderTextColor={colors.textMuted}
      style={styles.metricInput}
    />
  );
}

function MetricsTableHeader() {
  return (
    <View style={styles.tableHeader}>
      {TABLE_COLUMNS.map((column) => (
        <Text key={column} variant="caption" style={styles.tableHeaderText}>
          {column}
        </Text>
      ))}
    </View>
  );
}

interface MetricsTableRowProps {
  exercise: ExerciseMetricsBlock;
  rowIndex: number;
  activeRowKey: string | null;
  onRowFocus: (rowKey: string) => void;
  onRowBlur: (rowKey: string) => void;
  onMetricChange: (exerciseId: string, rowIndex: number, field: MetricField, value: string) => void;
}

function MetricsTableRow({
  exercise,
  rowIndex,
  activeRowKey,
  onRowFocus,
  onRowBlur,
  onMetricChange,
}: MetricsTableRowProps) {
  const row = exercise.rows[rowIndex];
  const rowKey = `${exercise.id}-${row.set}`;
  const isActive = activeRowKey === rowKey;

  return (
    <View style={[styles.metricRow, isActive && styles.metricRowActive]}>
      <View style={styles.setCell}>
        <Text variant="body" style={styles.cellNumberText}>{row.set}</Text>
      </View>

      {METRIC_COLUMNS.map((column) => (
        <MetricValueInput
          key={column.key}
          value={row[column.key]}
          rowKey={rowKey}
          onFocus={onRowFocus}
          onBlur={onRowBlur}
          onChangeText={(value) => onMetricChange(exercise.id, rowIndex, column.key, value)}
        />
      ))}
    </View>
  );
}

export function MetricsExerciseTable({
  exercise,
  index,
  activeRowKey,
  onRowFocus,
  onRowBlur,
  onMetricChange,
  onNotesChange,
}: MetricsExerciseTableProps) {
  return (
    <View style={styles.exerciseBox}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseOrderBadge}>
          <Text variant="caption" style={styles.exerciseOrderText}>
            {index + 1}
          </Text>
        </View>

        <View style={styles.exerciseTitleWrap}>
          <View style={styles.exerciseTitleRow}>
            <Text variant="header" tone="primary" style={styles.exerciseName}>
              {exercise.name}
            </Text>
            <ActivityIcon type={exercise.activityType} size="md" variant="plain" />
          </View>
        </View>
      </View>

      <LinearGradient
        colors={gradients.surface.colors}
        start={gradients.surface.start}
        end={gradients.surface.end}
        style={styles.tableWrap}
      >
        <MetricsTableHeader />

        {exercise.rows.map((row, rowIndex) => (
          <MetricsTableRow
            key={`${exercise.id}-${row.set}`}
            exercise={exercise}
            rowIndex={rowIndex}
            activeRowKey={activeRowKey}
            onRowFocus={onRowFocus}
            onRowBlur={onRowBlur}
            onMetricChange={onMetricChange}
          />
        ))}
      </LinearGradient>

      <View style={styles.notesWrap}>
        {exercise.restTimeLabel ? (
          <Text variant="caption" style={styles.restTimeText}>
            {exercise.restTimeLabel}
          </Text>
        ) : null}

        <TextInput
          value={exercise.notes}
          onChangeText={(notes) => onNotesChange(exercise.id, notes)}
          placeholder="Add notes"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={180}
          textAlignVertical="top"
          style={styles.notesInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseBox: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  exerciseOrderBadge: {
    width: 34,
    alignItems: 'center',
  },
  exerciseOrderText: {
    color: colors.textPrimary,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  exerciseTitleWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  exerciseName: {
    flexShrink: 1,
  },
  tableWrap: {
    marginHorizontal: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  tableHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingVertical: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricRowActive: {
    backgroundColor: colors.surfaceHighlight,
  },
  setCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellNumberText: {
    ...typography.bodySmall,
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
  },
  metricInput: {
    flex: 1,
    textAlign: 'center',
    ...typography.bodySmall,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  notesWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  restTimeText: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  notesInput: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.caption,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
});
