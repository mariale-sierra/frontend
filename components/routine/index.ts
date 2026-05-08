// ExerciseBlock: Collapsible list item for a single exercise within a routine.
// Shows the ExerciseHeader and expands below it to reveal the full metrics editor.
export * from './exerciseBlock';

// DayRoutineHeader: Top navigation bar for routine detail screens.
// Contains a back button, the screen title, and an optional right-side action (e.g., Save).
export * from './dayRoutineHeader';

// ExerciseHeader: Tappable header row for an exercise entry.
// Shows the exercise name, location, activity icon, set count (when expanded),
// an options menu, and a collapse/expand toggle chevron.
export * from './exerciseHeader';

// ExerciseListItem: Pressable row for browsing and selecting exercises to add to a routine.
// Displays the exercise name, location, activity icon, and fires an onAdd callback on press.
export * from './exerciseListItem';

// ExerciseMetricsEditor: Full metrics editor for a single exercise.
// Renders a strength-style table (sets / reps / rest) for strength exercises,
// or a schema-driven form for other exercise types.
export * from './exerciseMetricsEditor';

// ExerciseSetCounter: Plus/minus stepper with a numeric display for adjusting the set count on an exercise.
export * from './exerciseSetCounter';

// ExerciseNoteField: Free-text input for attaching a note to an individual exercise entry.
export * from './exerciseNoteField';

// RestDayOptionCard: Card that lets the user mark a routine day as a rest day instead of a workout.
// Uses a gradient background and descriptive copy.
export * from './restDayOptionCard';

// RoutinePickerCard: Summary card for a saved routine showing its name, exercise count,
// location summary, primary activity icon, and an edit button.
// Also exports CreateRoutinePickerCard for the "add new routine" card variant.
export * from './routinePickerCard';

// ExerciseSetTable: Re-export alias for ExerciseMetricsEditor (legacy name kept for compatibility).
export * from './exerciseSetTable';

// ExerciseInput: Labeled numeric text input for a single exercise metric field (e.g., reps, weight).
// Styled to match the metrics table row convention.
export * from './exerciseInput';

// RestTimeInput: Split minute/second input pair for specifying rest time between sets.
// Each field is labeled and styled consistently with ExerciseInput.
export * from './restTimeInput';

// FilterToggleButton: Toggle button that switches between active and inactive states
// for filtering exercises by a given attribute (e.g., muscle group, activity type).
export * from './filterToggleButton';

// MuscleGroupPickerModal: Bottom-sheet modal with two-level navigation.
// First level: list of muscle groups with exercise counts.
// Second level: exercises for the selected muscle group, with inline filter support.
export * from './MuscleGroupPickerModal';

// RoutineModeToggle: Segmented control for switching the routine day between Workout and Rest Day modes.
export * from './routineModeToggle';

// routineStyles: Shared StyleSheet definitions (colors, spacing, typography) reused across routine components.
export { routineStyles } from './routineStyles';
