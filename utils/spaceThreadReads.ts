import { storage } from './storage';

const STORAGE_KEY = 'spaceThreadLastViewedAt:v1';

/**
 * Client-side "have I seen this space thread's latest message" tracking.
 * Space messages have no read-tracking on the backend at all yet (unlike
 * 1:1 conversations' real `unreadCount` — see chats.service.ts) — no
 * `read_at`, no per-member "last read" column, nothing. Rather than fake a
 * server-backed unread state or drop the unread dot for space rows
 * entirely, this keeps one small locally-persisted map (spaceId -> ISO
 * timestamp of the last time THIS device opened that thread) and derives
 * "unread" by comparing it to the thread's latest message time
 * (`SpaceThreadListItem`). Per-device, not synced across a user's other
 * devices — a real limitation, but a reasonable one until the backend
 * grows real read-tracking for group threads.
 */
async function readMap(): Promise<Record<string, string>> {
  try {
    const raw = await storage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export async function getSpaceThreadLastViewedMap(): Promise<Record<string, string>> {
  return readMap();
}

export async function markSpaceThreadViewed(spaceId: string): Promise<void> {
  try {
    const map = await readMap();
    map[spaceId] = new Date().toISOString();
    await storage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Best-effort only — worst case, the unread dot for this thread just
    // stays on a bit longer than it should.
  }
}
