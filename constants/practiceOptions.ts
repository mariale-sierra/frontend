// Self-reported sport/fitness practices for the onboarding "what do you do"
// step — shown afterward as colored badges on the profile screen (see
// Profile-8B-Centered-Identity.html, the reference mockup). Same "small,
// frontend-owned reference list" pattern CATEGORY_OPTIONS/LOCATION_OPTIONS
// (challengeCreateOptions.ts) already use for challenge categories/locations
// — no backend table, the backend just stores whatever of these `value`
// strings the client sends (capped at 6).
//
// Each practice is tagged with one of the app's 6 real ActivityTypes so its
// badge inherits that type's own `activityColors` entry — not a new palette.
// Multiple practices can (and do) share a type/color on purpose: e.g. Yoga
// and Pilates are both `mindBody`, matching how the exercise catalog itself
// already classifies them (see exercise-metric-profiles.ts on the backend —
// named yoga/Pilates poses go to mind-body, not flexibility).
//
// Deliberately broader than the 6 examples in the mockup: those 6 alone only
// touch 5 of the 6 activity colors (nothing was `flexibility`) — the exact
// same "category with zero real members" bug already found and fixed once
// for the exercise catalog (see havit-design-system-SKILL.md). Added
// Stretching/Mobility here so `flexibility` badges actually exist too.
import type { ActivityType } from '../types/activity';

export interface PracticeOption {
  label: string;
  value: string;
  activityType: ActivityType;
}

/** How many practices a profile can show at once — the onboarding picker's
 * own hard cap, matching the mockup's one-row badge count. */
export const MAX_PRACTICE_PREFERENCES = 6;

export const PRACTICE_OPTIONS: PracticeOption[] = [
  // strength
  { label: 'Weightlifting', value: 'Weightlifting', activityType: 'strength' },
  { label: 'Bodybuilding', value: 'Bodybuilding', activityType: 'strength' },
  // cardioIntense
  { label: 'Boxing', value: 'Boxing', activityType: 'cardioIntense' },
  { label: 'HIIT', value: 'HIIT', activityType: 'cardioIntense' },
  { label: 'Running', value: 'Running', activityType: 'cardioIntense' },
  // cardioLow
  { label: 'Biking', value: 'Biking', activityType: 'cardioLow' },
  { label: 'Swimming', value: 'Swimming', activityType: 'cardioLow' },
  { label: 'Walking', value: 'Walking', activityType: 'cardioLow' },
  // flexibility
  { label: 'Stretching', value: 'Stretching', activityType: 'flexibility' },
  { label: 'Mobility', value: 'Mobility', activityType: 'flexibility' },
  // mindBody
  { label: 'Yoga', value: 'Yoga', activityType: 'mindBody' },
  { label: 'Pilates', value: 'Pilates', activityType: 'mindBody' },
  { label: 'Dance', value: 'Dance', activityType: 'mindBody' },
  // functional
  { label: 'Calisthenics', value: 'Calisthenics', activityType: 'functional' },
  { label: 'CrossFit', value: 'CrossFit', activityType: 'functional' },
  { label: 'Climbing', value: 'Climbing', activityType: 'functional' },
];

const PRACTICE_BY_VALUE = new Map(PRACTICE_OPTIONS.map((option) => [option.value, option]));

/** Resolves a saved practice_preferences string back to its label/color —
 * `null` for anything not in the current list (a practice removed from the
 * list after someone already picked it shouldn't crash their profile, just
 * quietly not render). */
export function getPracticeOption(value: string): PracticeOption | null {
  return PRACTICE_BY_VALUE.get(value) ?? null;
}
