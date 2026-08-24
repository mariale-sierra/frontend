// Workout category — a domain/data concept, independent of the design system.
//
// Previously lived in constants/theme.ts tied to a per-category color map.
// The design system retired that: workout category is now shown as icon +
// name only, never a color (see havit-design-system-SKILL.md → Explicitly
// Rejected Patterns → "No arbitrary hue color-coding for workout
// categories"). The category enum itself is still real data, so it lives
// here instead. Icon mapping per category still lives in
// components/icons/activityIcon.tsx.
export type ActivityType =
  | 'strength'
  | 'cardioIntense'
  | 'cardioLow'
  | 'flexibility'
  | 'mindBody'
  | 'functional';
