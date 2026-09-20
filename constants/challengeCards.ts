/**
 * Which challenge card design the app shows: Challenges-Mine, Challenges-Explore
 * (and Search's challenge results), and Home's hero card.
 *
 * `true` — the glow cards (`ChallengeStatusCardV2`, `ExploreChallengeCardV2`,
 * `ActiveChallengeItemV2`, all built on `ChallengeCard`): dark cards with the
 * challenge's activity color glowing up from the bottom edge.
 *
 * `false` — the classic cards (`ChallengeStatusCard`, `ExploreChallengeCard`,
 * and the hero card in `ActiveChallengeSection`): solid activity-color cards on
 * Mine / Home, a flat dark card on Explore. They are kept as-is, and all read
 * their logic from the same shared helpers, so flipping this is the whole
 * revert.
 */
export const USE_GLOW_CHALLENGE_CARDS = true;

/**
 * Which edge of the card the glow comes from on the glow cards in the
 * Challenges-Mine and Challenges-Explore lists (and Search's challenge
 * results): `top` hangs it from the top edge, like the Challenge-Info and
 * progress backdrops; `bottom` raises it from the bottom edge, as it first was.
 * Home's hero card and Space cards always keep the bottom glow. Turned upside
 * down on 2026-09-20, on explicit request — set this back to `'bottom'` to
 * undo it.
 */
export const LIST_CARD_GLOW_EDGE: 'top' | 'bottom' = 'top';
