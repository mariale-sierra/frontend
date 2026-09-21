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
 * The glow of the cards in the Challenges-Mine and Challenges-Explore lists (and
 * Search's challenge results).
 *
 * `true` — the mesh glow (`AccentMesh`): a colorful, organic gradient with its
 * own recipe for each activity color and for the rest-day and completed states,
 * strongest along the bottom and the right side (`MESH_RECIPES`). Since
 * 2026-09-20 (explicit request).
 *
 * `false` — the plain half-moon glow from the bottom edge (`AccentDome`), which
 * Home's hero card and Space cards always use. Flipping this is the whole revert.
 */
export const USE_MESH_CARD_GLOW = true;
