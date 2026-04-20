// CreateChallengeHeader: Top bar for the create flow showing author identity.
// Design: Compact horizontal layout with avatar and byline.
export * from './CreateChallengeHeader';

// ChallengeTitleInputs: Primary text entry block for challenge name and description.
// Design: Title-first hierarchy with tight vertical rhythm and minimal input chrome.
export * from './ChallengeTitleInputs';

// DurationStepper: Increment/decrement control for day count.
// Design: Inline counter with balanced +/- controls and clear numeric emphasis.
export * from './DurationStepper';

// CycleDayTimelineStepper: Multi-row connected timeline for day-by-day cycle sequencing.
// Design: Circular step nodes linked by connector paths with up to 7 days per row.
export * from './CycleDayTimelineStepper';

// CycleDayAssignmentPanel: Selected-day details and routine assignment controls.
// Design: Single action card that keeps assignment/edit/remove flows scoped to one day.
export * from './CycleDayAssignmentPanel';

// ChallengeVisibilitySection: Final setup area for duration override and public/private visibility.
// Design: Two-panel gradient grouping with strong form hierarchy for publishing decisions.
export * from './ChallengeVisibilitySection';

// ChallengeSubmitActions: Completion CTAs shown only when required setup fields are complete.
// Design: Single primary action with compact secondary utility actions and icons.
export * from './ChallengeSubmitActions';
