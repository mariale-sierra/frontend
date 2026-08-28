// Challenge list components for the challenges tab/screen

// challengeListSections: ExploreChallengeViewModel, shared by this tab's
// Explore list. No component lives here anymore — see
// ChallengeStatusCard/ChallengesViewToggle below.
export * from './challengeListSections';

// ExploreChallengeCard: Card component for displaying explorable challenges.
// Shows challenge details with badges and activity icons.
export * from './ExploreChallengeCard';

// ChallengeStatusCard: Challenges-Mine card — state-driven background
// (active/rest/completed/won/left — won/left share one neutral "no longer
// in progress" treatment), ink status pill, progress bar, and an "Add
// photo" CTA or the user's latest photo for the challenge (placeholder if
// they haven't posted one yet).
export * from './ChallengeStatusCard';

// ChallengesViewToggle: Mine/Explore segmented control for the Challenges tab.
export * from './ChallengesViewToggle';

// ChallengesContentSkeleton: a few card-shaped Skeleton blocks shown while
// the one challenges fetch (Mine + Explore + photos) is in flight, in place
// of a bare centered spinner. See components/ui/skeleton.tsx.
export * from './ChallengesContentSkeleton';
