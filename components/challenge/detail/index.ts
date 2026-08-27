// Challenge detail components for challenge detail views

// ChallengeHeader: Title + info-rows block (Challenge-Info wireframe) —
// icon/label/value rows ("Lasts", "Do it at", "Focus", "Daily proof").
export { default as ChallengeHeader } from './challengeHeader';
export type { ChallengeInfoRow } from './challengeHeader';

// ChallengeAboutSection: "About" section with a 4-line collapse/"Read more" toggle.
export { default as ChallengeAboutSection } from './challengeAboutSection';

// ChallengeRoutineList: "The cycle" section — flat list of cycle days
// (rest days included), no week pagination (a cycle repeats as a whole).
export { default as ChallengeRoutineList } from './challengeRoutineList';

// ChallengeRoutineDayCard: One numbered row in the cycle list — workout day
// (tappable, chevron) or rest day (not tappable, `rest`-colored title).
export { default as ChallengeRoutineDayCard } from './challengeRoutineDayCard';

// ChallengeInfoContentSkeleton: title + info-rows + About + cycle-list
// Skeleton placeholder, shown while the one getChallenge() fetch is loading.
export * from './challengeInfoContentSkeleton';

// ChallengeParticipantsList: Horizontal avatar row of challenge members.
// Tapping a member opens their public profile (with the Follow button).
// Not used by Challenge-Info anymore (its member-count pill now links to
// /challenge/:id/members instead) — left in place, unused, in case a future
// wireframe wants this specific horizontal-strip treatment.
export { default as ChallengeParticipantsList } from './challengeParticipantsList';