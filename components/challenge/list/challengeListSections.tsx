// View-model types shared across the challenge-list screens/adapter. The
// `ChallengeListSections` component that used to live in this file (mixed
// active+explore sections with "see all" headers) is retired — the
// Challenges tab (app/(tabs)/challenges.tsx) now shows Mine/Explore as two
// full lists behind a segmented toggle instead, using ChallengeStatusCard /
// ExploreChallengeCard directly. `ActiveChallengeViewModel` (the OLDER card
// model) was deleted from here — confirmed zero real consumers (its
// apparent Home usage was a stale grep false-positive matching
// `HomeActiveChallengeViewModel`'s substring, a completely separate type in
// `homeAdapter.ts` that Home actually uses). `ExploreChallengeViewModel`
// below is still real and shared with the Challenges tab.

export interface ExploreChallengeViewModel {
  challengeId: string;
  title: string;
  durationDays: number;
  cycleLengthDays: number;
  restDaysCount: number;
  locationsLabel: string;
  categoriesLabel: string;
  membersCount: number;
}
