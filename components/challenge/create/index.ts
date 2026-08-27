// CreateFlowProgressHeader: Back button + "Step N of total" + segmented progress bar.
// Design: shared top-of-screen widget for every step of the 5-step create-challenge flow.
export * from './CreateFlowProgressHeader';

// ChallengeNameFields: Challenge name + optional description inputs (Step 1).
export * from './ChallengeNameFields';

// OptionPillGrid: Flex-wrap icon+label pill multi-select (Step 2 — activity/location).
export * from './OptionPillGrid';

// CycleDayList: Numbered-badge day rows with Add/Edit/Remove (Step 3 — Build the Cycle).
export * from './CycleDayList';

// RepeatsStepper: "Repeats" cycles counter + duration/end-date callout (Step 4).
export * from './RepeatsStepper';

// VisibilityCardGroup: Public/Private selectable cards (Step 4).
export * from './VisibilityCardGroup';

// ChallengeReviewSummary: Hero card + Setup/Cycle summary cards (Step 5 — Review).
export * from './ChallengeReviewSummary';

// CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar: deleted —
// app/(add)/metrics.tsx (their last remaining consumer) got its own wireframe
// pass and moved onto CreateFlowPrimaryButton + a plain bottom-bar View, the
// same swap routine create/select/exercises already made. `ChallengeTitleInputs`
// was deleted the same way once routine/create.tsx moved off it.

// CreateFlowPrimaryButton: Full-width 52px primary CTA, retokenized — used by
// every step of the create-challenge flow.
export * from './CreateFlowPrimaryButton';
