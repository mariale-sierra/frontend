// Challenge list components for the challenges tab/screen

// challengeListSections: view-model types shared by the list screens/adapter
// (ActiveChallengeViewModel, ExploreChallengeViewModel, ChallengesScreenViewModel).
// No component lives here anymore — see ChallengeStatusCard/ChallengesViewToggle below.
export * from './challengeListSections';

// ActiveChallengeCard: Card component for displaying active challenges.
// Shows progress, day count, and streak information with gradient background.
export * from './ActiveChallengeCard';

// ExploreChallengeCard: Card component for displaying explorable challenges.
// Shows challenge details with badges and activity icons.
export * from './ExploreChallengeCard';

// ChallengeBadge: Small badge component for challenge attributes.
// Displays text badges with consistent styling for challenge features.
export * from './ChallengeBadge';

// ChallengeProgressBar: Progress bar component for challenge completion.
// Shows visual progress with customizable colors and styling.
export * from './ChallengeProgressBar';

// ChallengeStatusCard: Challenges-Mine card — state-driven background
// (active/rest/completed/won/left — won/left share one neutral "no longer
// in progress" treatment), ink status pill, progress bar, and an "Add
// photo" CTA or the user's latest photo for the challenge (placeholder if
// they haven't posted one yet).
export * from './ChallengeStatusCard';

// ChallengesViewToggle: Mine/Explore segmented control for the Challenges tab.
export * from './ChallengesViewToggle';
