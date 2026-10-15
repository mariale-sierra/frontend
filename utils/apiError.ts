// Shared reading of a failed request, kept dependency-free (no api/i18n
// import, like contentModeration.ts) so hooks and screens can use it without
// pulling the axios client into their tests.

interface ApiErrorLike {
  response?: { status?: number; data?: { message?: unknown; code?: unknown } };
  config?: { suppressErrorToast?: boolean; method?: string; url?: string };
  code?: string;
  message?: string;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return (error as ApiErrorLike | undefined)?.response?.status;
}

/** A request that never got an answer: offline, DNS, refused, or timed out. */
export function isNetworkError(error: unknown): boolean {
  const e = error as ApiErrorLike | undefined;
  if (!e || e.response) return false;
  return (
    e.message === 'Network Error' ||
    e.code === 'ERR_NETWORK' ||
    e.code === 'ECONNABORTED' ||
    e.code === 'ETIMEDOUT'
  );
}

// Backend messages a user can act on, mapped to `common.errors.known.*` (the
// API answers in English). Anything else gets the translated message for its
// status: raw server text (class-validator arrays, internal names) never
// reaches the UI.
const KNOWN_BACKEND_MESSAGES: Record<string, string> = {
  'Already joined this challenge': 'alreadyMember',
  'User is already a member of this challenge': 'alreadyMember',
  'You are already a member of this space': 'alreadyMember',
  'This challenge is closed': 'challengeClosed',
  'Challenge is already closed': 'challengeClosed',
  'You already logged progress today': 'alreadyLoggedToday',
  'Invite has expired': 'inviteExpired',
  'You already reported this content': 'alreadyReported',
  'You cannot report your own content': 'cannotReportOwn',
  'You cannot join a challenge you created': 'ownChallenge',
  'User is the creator of this challenge': 'ownChallenge',
  'Email already in use': 'emailInUse',
  'Username already in use': 'usernameInUse',
  'Account deletion already requested': 'deletionAlreadyRequested',
  'Cycle length cannot exceed duration': 'cycleTooLong',
};

export function knownApiMessageKey(error: unknown): string | undefined {
  const message = (error as ApiErrorLike | undefined)?.response?.data?.message;
  return typeof message === 'string' ? KNOWN_BACKEND_MESSAGES[message.trim()] : undefined;
}

function isTimeout(error: unknown) {
  const code = (error as ApiErrorLike | undefined)?.code;
  return code === 'ECONNABORTED' || code === 'ETIMEDOUT';
}

type Translate = (key: string) => string;

/**
 * A failed request's message for an inline error or a screen's own toast: a
 * known backend message in the app's language, the moderation/timeout/network
 * message when that is what happened, else the caller's translated `fallback`.
 */
export function getApiErrorMessage(error: unknown, t: Translate, fallback: string): string {
  const known = knownApiMessageKey(error);
  if (known) return t(`common.errors.known.${known}`);
  const response = (error as ApiErrorLike | undefined)?.response;
  if (response?.status === 400 && response.data?.code === 'CONTENT_REJECTED') {
    return t('common.errors.contentRejectedMessage');
  }
  if (isTimeout(error)) return t('common.errors.timeoutMessage');
  if (isNetworkError(error)) return t('common.errors.networkErrorMessage');
  return fallback;
}

/**
 * true when the global interceptor in services/api.ts already showed a toast
 * for this error — a screen must not show a second Alert/toast for it (it may
 * still show an inline message next to the field or button that failed).
 */
export function wasErrorToastShown(error: unknown): boolean {
  const e = error as ApiErrorLike | undefined;
  if (!e || e.config?.suppressErrorToast) return false;
  return Boolean(e.response) || isNetworkError(error);
}

/**
 * Dev-only description of an error that is safe to print: status, method,
 * path (no query string) and the error code. Never response bodies, headers
 * (the bearer token travels in them), request payloads or signed upload URLs.
 */
export function describeError(error: unknown): string {
  if (error == null) return 'unknown error';
  const e = error as ApiErrorLike;
  if (e.response || e.config) {
    const method = e.config?.method?.toUpperCase() ?? '';
    const path = (e.config?.url ?? '').split('?')[0];
    const status = e.response?.status ?? e.code ?? 'no response';
    const code = typeof e.response?.data?.code === 'string' ? ` ${e.response.data.code}` : '';
    return `${method} ${path} -> ${status}${code}`.trim();
  }
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

/**
 * Dev-only error log that goes through `describeError` (nothing sensitive in
 * release logs). A 4xx answer is skipped: it is an expected outcome the screen
 * already explained to the user (wrong password, taken email...), and in
 * development `console.error` would pop a red LogBox for it as if it were a bug.
 */
export function logError(scope: string, error?: unknown) {
  if (!__DEV__) return;
  const status = getApiErrorStatus(error);
  if (status !== undefined && status >= 400 && status < 500) return;
  console.error(`[${scope}]`, describeError(error));
}

/** Dev-only warning for unexpected-but-handled situations. */
export function logWarn(scope: string, message: string) {
  if (!__DEV__) return;
  console.warn(`[${scope}]`, message);
}
