import { StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../constants/theme';

/**
 * Reusable style definitions for routine builder components
 * Extracts repeated patterns for dividers, borders, and common styling
 */

export const routineStyles = StyleSheet.create({
  /**
   * Divider line - used to separate sections in exercise blocks and lists
   * Appears in: ExerciseBlock, ExerciseListItem, ExerciseMetricsEditor, RoutinePickerCard
   */
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    width: '100%',
  },

  /**
   * Lighter divider - subtle separation for visual hierarchy
   */
  dividerLight: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },

  /**
   * Pressed state - common opacity effect for interactive elements
   */
  pressed: {
    opacity: 0.8,
  },

  /**
   * Muted/disabled text state
   */
  disabledText: {
    opacity: 0.4,
  },

  /**
   * Standard gap between fields in exercise sections
   */
  fieldStack: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  } as ViewStyle,

  /**
   * Section containers with top/bottom borders
   */
  sectionContainer: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  } as ViewStyle,

  /**
   * Horizontal padding for section content
   */
  sectionPadding: {
    paddingHorizontal: spacing.lg,
  } as ViewStyle,
});
