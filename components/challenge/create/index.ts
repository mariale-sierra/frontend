// CreateFlowProgressHeader: Back button + "Step N of total" + segmented progress bar.
// Design: shared top-of-screen widget for every step of the 5-step create-challenge flow.
export * from './CreateFlowProgressHeader';

// ChallengeNameFields: Challenge name + optional description inputs (Step 1).
export * from './ChallengeNameFields';

// OptionPillGrid: Flex-wrap icon+label pill multi-select (Step 2 — activity/location).
export * from './OptionPillGrid';

// CycleLengthCard: "Cycle" + "Challenge length" steppers in one card (Step 3 — 53A, Cycle & length).
export * from './CycleLengthCard';

// CycleCalendarPreview: Mon–Sun calendar of the whole challenge, cycle day per cell (Steps 3 and 4).
export * from './CycleCalendarPreview';

// CycleDayList: Numbered-badge day rows with Add/Edit/Remove (Step 4 — 53B, Fill in your cycle).
export * from './CycleDayList';

// VisibilityCardGroup: Public/Private selectable cards (Step 5).
export * from './VisibilityCardGroup';

// ChallengeReviewSummary: Hero card + Setup/Cycle summary cards (Step 6 — Review).
export * from './ChallengeReviewSummary';

// CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar: deleted —
// app/(add)/metrics.tsx (their last remaining consumer) got its own wireframe
// pass and moved onto CreateFlowPrimaryButton + a plain bottom-bar View, the
// same swap routine create/select/exercises already made. `ChallengeTitleInputs`
// was deleted the same way once routine/create.tsx moved off it.

// CreateFlowPrimaryButton: Full-width 52px primary CTA, retokenized — used by
// every step of the create-challenge flow.
export * from './CreateFlowPrimaryButton';
export { ChallengeRulesStep } from './ChallengeRulesStep';
