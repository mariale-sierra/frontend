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

import type { ActivityType } from '../../../types/activity';

/** Who made a challenge — trimmed down to what an Explore card actually shows
 * (no `id`: the card links to the challenge, not the author's profile yet). */
export interface ChallengeAuthorViewModel {
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
}

export interface ExploreChallengeViewModel {
  challengeId: string;
  title: string;
  durationDays: number;
  cycleLengthDays: number;
  restDaysCount: number;
  locationsLabel: string;
  categoriesLabel: string;
  membersCount: number;
  /** Activity Color System v2 — this challenge's dominant activity category
   * (`null` if it has no exercises yet). Resolve the card's accent color via
   * `challengeState.ts`'s `getChallengeAccentColor()`. */
  dominantActivityCategory: ActivityType | null;
  /** Who created it — `null`/absent when the creator's account no longer
   * exists, or an older cached response never carried `author` at all. */
  author?: ChallengeAuthorViewModel | null;
}

/** The props of a Challenges-Explore card — the same for every design of it. */
export interface ExploreChallengeCardProps {
  challenge: ExploreChallengeViewModel;
  onPress?: () => void;
}
