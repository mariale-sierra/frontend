import { USE_GLOW_CHALLENGE_CARDS } from '../../../constants/challengeCards';
import { ChallengeStatusCard } from './ChallengeStatusCard';
import { ChallengeStatusCardV2 } from './ChallengeStatusCardV2';
import { ExploreChallengeCard } from './ExploreChallengeCard';
import { ExploreChallengeCardV2 } from './ExploreChallengeCardV2';

/**
 * The card designs the Challenges tab and Search actually render — the glow
 * cards or the classic ones, per `USE_GLOW_CHALLENGE_CARDS`. Both designs of a
 * card take the same props and read the same logic, so screens import these and
 * never care which is live. (Home's hero card makes the same choice inside
 * `ActiveChallengeSection`.)
 */
export const MineCard = USE_GLOW_CHALLENGE_CARDS ? ChallengeStatusCardV2 : ChallengeStatusCard;
export const ExploreCard = USE_GLOW_CHALLENGE_CARDS ? ExploreChallengeCardV2 : ExploreChallengeCard;
