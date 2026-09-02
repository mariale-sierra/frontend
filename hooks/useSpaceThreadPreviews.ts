import { useEffect, useState } from 'react';
import { getSpaceMessages } from '../services/spaces/spaces.service';
import { getSpaceThreadLastViewedMap } from '../utils/spaceThreadReads';
import type { SpaceContract, SpaceMessageContract } from '../types/space';

export interface SpaceThreadPreview {
  space: SpaceContract;
  lastMessage: SpaceMessageContract | null;
  /** ISO timestamp this device last opened this space's thread, or `null`
   * if never — see `utils/spaceThreadReads.ts`. `SpaceThreadListItem`
   * compares this against `lastMessage.sentAt` to decide the unread dot. */
  lastViewedAt: string | null;
}

/**
 * The latest message (if any) for each already-joined space, so the
 * Messages list (Chats-46A) can show a real preview line + timestamp for a
 * space thread the same way it does for a 1:1 conversation's own
 * `lastMessage`. There's no batch "my joined spaces with previews" endpoint
 * — `GET /spaces` (what `useSpaces` already calls) returns no message data
 * at all — so this fetches each joined space's latest message individually
 * (`getSpaceMessages(id, { limit: 1 })`) in parallel. Fine at this app's
 * current scale (a handful of joined spaces per user); would need a real
 * batch endpoint if that ever stops being true.
 *
 * Takes the already-fetched, already-filtered joined `SpaceContract[]`
 * (from `useSpaces`) rather than fetching its own space list — refetches
 * whenever that array's reference changes, which happens whenever
 * `useSpaces`' own focus-triggered reload produces new data (so returning
 * to this list after reading a thread picks up the freshly-marked
 * `lastViewedAt` too).
 */
export function useSpaceThreadPreviews(joinedSpaces: SpaceContract[]) {
  const [previews, setPreviews] = useState<SpaceThreadPreview[]>([]);
  const [loading, setLoading] = useState(joinedSpaces.length > 0);

  useEffect(() => {
    if (joinedSpaces.length === 0) {
      setPreviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getSpaceThreadLastViewedMap(),
      Promise.all(
        joinedSpaces.map((space) =>
          getSpaceMessages(space.id, { limit: 1 })
            .then((page) => ({ space, lastMessage: page.messages[0] ?? null }))
            .catch(() => ({ space, lastMessage: null })),
        ),
      ),
    ])
      .then(([lastViewedMap, results]) =>
        setPreviews(
          results.map((result) => ({
            ...result,
            lastViewedAt: lastViewedMap[result.space.id] ?? null,
          })),
        ),
      )
      .finally(() => setLoading(false));
  }, [joinedSpaces]);

  return { previews, loading };
}
