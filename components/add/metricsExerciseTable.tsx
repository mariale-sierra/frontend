import { StyleSheet, TextInput, View } from 'react-native';
import { ActivityIcon } from '../icons/activityIcon';
import { Text } from '../ui/text';
import { colors, spacing, typography } from '../../constants/theme';
import type { ExerciseMetricsBlock, MetricField } from '../../types/metrics';
import { ACTIVITY_METRIC_CONFIG } from '../../types/metrics';
import { useTranslation } from 'react-i18next';

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

function MetricsTableHeader({ columns }: { columns: string[] }) {
  return (
    <View style={styles.tableHeader}>
      {columns.map((column) => (
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
  metricColumns: Array<{ key: MetricField; label: string }>;
  showSetColumn: boolean;
  activeRowKey: string | null;
  onRowFocus: (rowKey: string) => void;
  onRowBlur: (rowKey: string) => void;
  onMetricChange: (exerciseId: string, rowIndex: number, field: MetricField, value: string) => void;
}

function MetricsTableRow({
  exercise,
  rowIndex,
  metricColumns,
  showSetColumn,
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
      {showSetColumn && (
        <View style={styles.setCell}>
          <Text variant="body" style={styles.cellNumberText}>{row.set}</Text>
        </View>
      )}

      {metricColumns.map((column) => (
        <MetricValueInput
          key={column.key}
          value={row[column.key] ?? ''}
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
  const { t } = useTranslation();
  const config = ACTIVITY_METRIC_CONFIG[exercise.activityType] ?? ACTIVITY_METRIC_CONFIG.strength;
  const tableColumns = config.showSetColumn
    ? ['set', ...config.columns.map((c) => c.label)]
    : config.columns.map((c) => c.label);

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

      {/* Gradients are retired — flat `surface` panel. See design system →
          Explicitly Rejected Patterns. */}
      <View style={styles.tableWrap}>
        <MetricsTableHeader columns={tableColumns} />

        {exercise.rows.map((row, rowIndex) => (
          <MetricsTableRow
            key={`${exercise.id}-${row.set}`}
            exercise={exercise}
            rowIndex={rowIndex}
            metricColumns={config.columns}
            showSetColumn={config.showSetColumn}
            activeRowKey={activeRowKey}
            onRowFocus={onRowFocus}
            onRowBlur={onRowBlur}
            onMetricChange={onMetricChange}
          />
        ))}
      </View>

      <View style={styles.notesWrap}>
        {exercise.restTimeLabel ? (
          <Text variant="caption" style={styles.restTimeText}>
            {exercise.restTimeLabel}
          </Text>
        ) : null}

        <TextInput
          value={exercise.notes}
          onChangeText={(notes) => onNotesChange(exercise.id, notes)}
          placeholder={t('metrics.addNotes')}
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
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  exerciseOrderBadge: {
    width: 30,
    alignItems: 'center',
  },
  exerciseOrderText: {
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 26,
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
    backgroundColor: colors.surface,
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
