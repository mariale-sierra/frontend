import { staleTimes } from '../queries';

// B5 — CP6: the backend now returns SIGNED, time-limited URLs for every
// profile/post/space photo (shortest TTL: 10 min for a private post — see
// backend/src/uploads/uploads.service.ts's SIGNED_READ_TTL_SECONDS). None of
// this app's own cache `staleTime`s were changed for B5 — they were already
// well under any of the new TTLs (tuned for social freshness, not security)
// — but this pins that fact down as an explicit regression guard: if a
// future change ever raises one of these past the shortest signed-URL TTL,
// a screen could render a stale, already-expired image URL from its own
// cache before re-asking the server for a fresh one.
const SHORTEST_SIGNED_URL_TTL_SECONDS = 10 * 60; // private post — see above

describe('staleTimes (B5 — CP6 regression guard)', () => {
  it.each(Object.entries(staleTimes).filter(([key]) => key !== 'reference'))(
    'staleTimes.%s stays well under the shortest signed-URL TTL (10 min)',
    (_key, ms) => {
      expect(ms).toBeLessThan(SHORTEST_SIGNED_URL_TTL_SECONDS * 1000);
    },
  );

  // `reference` (exercise catalog) is excluded above on purpose: it never
  // carries a user photo URL (see queries.ts's own comment), so it isn't
  // bound by this invariant.
  it('reference staleTime is excluded because it never carries a photo URL', () => {
    expect(staleTimes.reference).toBeGreaterThan(SHORTEST_SIGNED_URL_TTL_SECONDS * 1000);
  });
});
