import { Skeleton } from '../../ui/skeleton';
import { Stack } from '../../layout/stack';
import { radius } from '../../../constants/theme';

const CARD_COUNT = 3;
// Both card shapes (ChallengeStatusCard, ExploreChallengeCard) land on
// ~176px tall in practice, so one skeleton height covers either tab.
const CARD_HEIGHT = 176;

/** Mirrors a handful of list-row cards (Mine's `ChallengeStatusCard` or
 * Explore's `ExploreChallengeCard`, both ~176px tall) — shown while the
 * one challenges fetch is in flight, instead of a bare centered spinner.
 * The header above it (title, "+ New", the Mine/Explore toggle) isn't
 * fetch-dependent, so it keeps rendering immediately, same as Home's
 * greeting. */
export function ChallengesContentSkeleton() {
  return (
    <Stack gap="md">
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <Skeleton key={index} height={CARD_HEIGHT} radius={radius.big} />
      ))}
    </Stack>
  );
}
