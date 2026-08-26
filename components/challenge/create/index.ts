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

// CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar: routine
// create/select/exercises all got their own wireframe pass and moved off
// these (now use CreateFlowPrimaryButton + a plain bottom-bar View instead —
// see app/challenge/routine/{create,select,exercises}.tsx). The only
// remaining consumer is app/(add)/metrics.tsx, out of scope for this pass —
// left as-is until that screen gets its own wireframe. `ChallengeTitleInputs`
// had zero remaining consumers once routine/create.tsx moved off it and was
// deleted outright.
export * from './CreateChallengePrimaryActionButton';
export * from './CreateFlowFixedBottomBar';

// CreateFlowPrimaryButton: Full-width 52px primary CTA, retokenized — used by
// every step of the create-challenge flow.
export * from './CreateFlowPrimaryButton';
