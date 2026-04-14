// CreateChallengeHeader: Top bar for the create flow showing author identity and a close action.
// Design: Compact horizontal layout with avatar, byline, and subtle surface close button.
export * from './CreateChallengeHeader';

// ChallengeTitleInputs: Primary text entry block for challenge name and description.
// Design: Title-first hierarchy with tight vertical rhythm and minimal input chrome.
export * from './ChallengeTitleInputs';

// ChallengeConfigurationSection: Configuration cluster for categories, location, and cycle duration.
// Design: Stacked gradient shells that group selection controls into a single settings panel.
export * from './ChallengeConfigurationSection';

// DurationStepper: Increment/decrement control for day count.
// Design: Inline counter with balanced +/- controls and clear numeric emphasis.
export * from './DurationStepper';

// ChallengeDaysList: Repeating list of day rows generated from the requested duration.
// Design: Uniform vertical list spacing to keep day planning scannable.
export * from './ChallengeDaysList';

// ChallengeDayRow: Single day item with a tappable mini-card action placeholder.
// Design: Centered row composition that highlights the day label and add-content affordance.
export * from './ChallengeDayRow';

// ChallengeVisibilitySection: Final setup area for duration override and public/private visibility.
// Design: Two-panel gradient grouping with strong form hierarchy for publishing decisions.
export * from './ChallengeVisibilitySection';
