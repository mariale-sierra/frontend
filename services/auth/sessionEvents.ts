/**
 * Bridge between the shared API client (services/api.ts), which sees a 401,
 * and AuthProvider, which owns the session state — without api.ts importing
 * the React context (that would be a dependency cycle).
 */
type SessionExpiredHandler = () => void | Promise<void>;

let handler: SessionExpiredHandler | null = null;
let running = false;

export function setSessionExpiredHandler(next: SessionExpiredHandler | null) {
  handler = next;
}

/**
 * The backend rejected the stored token (expired, or the account was banned
 * / purged / no longer exists). Several requests usually fail at once; only
 * the first one triggers the sign-out.
 */
export function notifySessionExpired() {
  if (!handler || running) return;
  running = true;
  Promise.resolve()
    .then(handler)
    .catch(() => undefined)
    .finally(() => {
      running = false;
    });
}
