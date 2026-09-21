import { storage } from './storage';

// Which challenges have already shown their "Challenge complete" popup — kept in
// storage, not just in memory, so it shows once per challenge EVER: an in-memory
// set reset on every cold start, and the same popup re-appeared every day the app
// was reopened, for every already-finished challenge (a real bug, fixed
// 2026-08-28). Shared by the logging flow (which shows it the moment the last day
// is logged) and the Challenges tab (which shows it for a challenge that finished
// elsewhere), so neither shows it a second time after the other.
const SHOWN_COMPLETIONS_KEY = 'shown_challenge_completions';

let shown: Promise<Set<string>> | null = null;

function loadShown(): Promise<Set<string>> {
  if (!shown) {
    shown = storage
      .getItem(SHOWN_COMPLETIONS_KEY)
      .then((raw) => {
        try {
          const ids = raw ? JSON.parse(raw) : [];
          return new Set<string>(Array.isArray(ids) ? ids : []);
        } catch {
          // A corrupt or old value is treated as empty, not fatal.
          return new Set<string>();
        }
      })
      .catch(() => new Set<string>());
  }
  return shown;
}

/** Has this challenge's completion popup been shown already? */
export async function hasShownCompletion(challengeId: string): Promise<boolean> {
  return (await loadShown()).has(challengeId);
}

/** Records that this challenge's completion popup has been shown. */
export async function markCompletionShown(challengeId: string): Promise<void> {
  const ids = await loadShown();
  ids.add(challengeId);
  await storage.setItem(SHOWN_COMPLETIONS_KEY, JSON.stringify(Array.from(ids))).catch(() => undefined);
}

/** Forgets what was loaded, so the next call reads storage again. For tests. */
export function resetShownCompletionsCache(): void {
  shown = null;
}
