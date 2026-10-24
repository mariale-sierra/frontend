import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Small shared cache for server data (no extra dependency): one entry per key,
 * kept in memory for the whole app session and, for keys fetched with
 * `persist: true`, also in AsyncStorage under the signed-in user's id, so a cold
 * start paints the last known Home/Profile/Challenges right away and only then
 * revalidates.
 *
 * The server stays the source of truth: cached data is only reused while it is
 * younger than the caller's `staleTime`, every mutation either writes the
 * server's answer back (`setQueryData`) or marks the related keys stale
 * (`invalidateQueries`), and a key that is on screen when it goes stale is
 * refetched at once. Two callers asking for the same key at the same time share
 * one request.
 */

export interface QueryEntry<T = unknown> {
  data: T | undefined;
  hasData: boolean;
  /** When `data` last came from the server; 0 once invalidated. */
  updatedAt: number;
  isFetching: boolean;
  error: unknown;
}

export interface FetchQueryOptions {
  /** Reuse cached data younger than this (ms). 0 = always ask the server. */
  staleTime?: number;
  /** Ignore `staleTime` (pull-to-refresh). An in-flight request is still shared. */
  force?: boolean;
  /** Also keep the entry in AsyncStorage for the next cold start. */
  persist?: boolean;
}

type Fetcher<T> = () => Promise<T>;

interface Observer {
  fetcher: Fetcher<unknown>;
  options: FetchQueryOptions;
}

const STORAGE_PREFIX = 'havit.queryCache.v1';
// Android's AsyncStorage rows break past ~2MB; a cache entry that big is not
// worth a disk write anyway — it stays memory-only.
const MAX_PERSISTED_CHARS = 512 * 1024;

const EMPTY_ENTRY: QueryEntry = Object.freeze({
  data: undefined,
  hasData: false,
  updatedAt: 0,
  isFetching: false,
  error: undefined,
}) as QueryEntry;

let scope: string | null = null;
// Bumped whenever the session changes, so a request started for the previous
// user can never write its answer into the next user's cache.
let generation = 0;

const entries = new Map<string, QueryEntry>();
const inFlight = new Map<string, Promise<unknown>>();
const hydrations = new Map<string, Promise<void>>();
const persistedKeys = new Set<string>();
// Last local write or invalidation per key: a request that started before it
// answers with data that may predate the change.
const touchedAt = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();
const observers = new Map<string, Set<Observer>>();

function storageKey(key: string) {
  return `${STORAGE_PREFIX}:${scope}:${key}`;
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function notifyAll() {
  listeners.forEach((set) => set.forEach((listener) => listener()));
}

function write(key: string, patch: Partial<QueryEntry>) {
  const next = { ...(entries.get(key) ?? EMPTY_ENTRY), ...patch };
  entries.set(key, next);
  notify(key);
  return next;
}

function persist(key: string, entry: QueryEntry) {
  if (!scope || !persistedKeys.has(key) || !entry.hasData) return;
  let serialized: string;
  try {
    serialized = JSON.stringify({ data: entry.data, updatedAt: entry.updatedAt });
  } catch {
    return;
  }
  if (serialized.length > MAX_PERSISTED_CHARS) return;
  AsyncStorage.setItem(storageKey(key), serialized).catch(() => {});
}

/** Loads a persisted entry once per key and session, unless fresher data is already in memory. */
function hydrate(key: string): Promise<void> {
  if (!scope || !persistedKeys.has(key)) return Promise.resolve();
  const existing = hydrations.get(key);
  if (existing) return existing;
  const gen = generation;
  const promise = AsyncStorage.getItem(storageKey(key))
    .then((raw) => {
      if (!raw || gen !== generation || entries.get(key)?.hasData) return;
      const parsed = JSON.parse(raw) as { data: unknown; updatedAt: number };
      write(key, { data: parsed.data, hasData: true, updatedAt: Number(parsed.updatedAt) || 0 });
    })
    .catch(() => {});
  hydrations.set(key, promise);
  return promise;
}

function isFresh(entry: QueryEntry | undefined, staleTime: number) {
  return Boolean(entry?.hasData && entry.updatedAt > 0 && Date.now() - entry.updatedAt < staleTime);
}

function matches(key: string, pattern: string) {
  // `user:` matches every `user:...` key; anything else is an exact key.
  return pattern.endsWith(':') ? key.startsWith(pattern) : key === pattern;
}

/** Which user the cache belongs to. A different user starts from an empty memory cache. */
export function setQueryScope(userId: string | null) {
  if (scope === userId) return;
  scope = userId;
  generation += 1;
  entries.clear();
  inFlight.clear();
  hydrations.clear();
  touchedAt.clear();
  notifyAll();
}

/** Forgets everything for the current user, in memory and on disk (logout, expired session). */
export async function clearQueryCache() {
  const previousScope = scope;
  generation += 1;
  entries.clear();
  inFlight.clear();
  hydrations.clear();
  touchedAt.clear();
  notifyAll();
  if (!previousScope) return;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `${STORAGE_PREFIX}:${previousScope}:`;
    const owned = keys.filter((key) => key.startsWith(prefix));
    if (owned.length > 0) await AsyncStorage.multiRemove(owned);
  } catch {
    // Disk cleanup is best effort; the scoped keys can never be read by another user.
  }
}

export function getQueryEntry<T>(key: string): QueryEntry<T> {
  return (entries.get(key) ?? EMPTY_ENTRY) as QueryEntry<T>;
}

export function getQueryData<T>(key: string): T | undefined {
  return entries.get(key)?.data as T | undefined;
}

export function subscribeQuery(key: string, listener: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

/**
 * Returns cached data while it is fresh, otherwise asks the server (sharing a
 * request already in flight for the same key) and caches the answer.
 */
export async function fetchQuery<T>(key: string, fetcher: Fetcher<T>, options: FetchQueryOptions = {}): Promise<T> {
  const { staleTime = 0, force = false } = options;
  if (options.persist) {
    persistedKeys.add(key);
    await hydrate(key);
  }

  const current = entries.get(key);
  if (!force && isFresh(current, staleTime)) return current!.data as T;

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const gen = generation;
  const startedAt = Date.now();
  const promise = Promise.resolve()
    .then(() => fetcher())
    .then((data) => {
      if (gen === generation) {
        const outdated = (touchedAt.get(key) ?? 0) >= startedAt;
        const next = write(key, {
          data,
          hasData: true,
          // Changed locally while this request was out: keep the answer but
          // leave the entry stale, and ask again if it is on screen.
          updatedAt: outdated ? 0 : Date.now(),
          isFetching: false,
          error: undefined,
        });
        persist(key, next);
        // After this request has left `inFlight`, so the refetch is a new one.
        if (outdated) setTimeout(() => refetchObserved(key), 0);
      }
      return data;
    })
    .catch((error: unknown) => {
      if (gen === generation) write(key, { isFetching: false, error });
      throw error;
    })
    .finally(() => {
      if (inFlight.get(key) === promise) inFlight.delete(key);
    });

  inFlight.set(key, promise);
  write(key, { isFetching: true, error: undefined });
  return promise;
}

/**
 * Writes data locally (optimistic update, or a mutation's server answer). The
 * updater receives the current data and may return `undefined` to leave it as is.
 */
export function setQueryData<T>(key: string, updater: T | ((previous: T | undefined) => T | undefined)) {
  const current = entries.get(key);
  const next =
    typeof updater === 'function'
      ? (updater as (previous: T | undefined) => T | undefined)(current?.data as T | undefined)
      : updater;
  if (next === undefined) return;
  touchedAt.set(key, Date.now());
  // A local patch keeps the entry's server timestamp; brand-new data counts as fresh.
  const entry = write(key, { data: next, hasData: true, updatedAt: current?.hasData ? current.updatedAt : Date.now() });
  persist(key, entry);
}

/** Applies `updater` to every cached key matching `pattern` (see `invalidateQueries`). */
export function updateQueries<T>(pattern: string, updater: (previous: T) => T | undefined) {
  for (const key of Array.from(entries.keys())) {
    const entry = entries.get(key)!;
    if (!matches(key, pattern) || !entry.hasData) continue;
    const next = updater(entry.data as T);
    if (next !== undefined && next !== entry.data) {
      touchedAt.set(key, Date.now());
      const written = write(key, { data: next });
      persist(key, written);
    }
  }
}

/**
 * Marks keys stale after a mutation. `pattern` is an exact key, or a prefix
 * ending in `:` (`'user-posts:'`). Keys currently shown on screen refetch right
 * away; the rest refetch the next time a screen asks for them.
 */
export function invalidateQueries(...patterns: string[]) {
  const now = Date.now();
  for (const key of Array.from(entries.keys())) {
    if (!patterns.some((pattern) => matches(key, pattern))) continue;
    touchedAt.set(key, now);
    write(key, { updatedAt: 0 });
    // A request already out answers with pre-mutation data; its own `then`
    // sees `touchedAt` and refetches once it lands.
    if (!inFlight.has(key)) refetchObserved(key);
  }
}

function refetchObserved(key: string) {
  const active = observers.get(key);
  const observer = active ? Array.from(active)[0] : undefined;
  if (observer) fetchQuery(key, observer.fetcher, { ...observer.options, force: true }).catch(() => {});
}

/** Registers an on-screen consumer of `key`, so invalidation can refetch it immediately. */
export function observeQuery(key: string, observer: Observer) {
  let set = observers.get(key);
  if (!set) {
    set = new Set();
    observers.set(key, set);
  }
  set.add(observer);
  return () => {
    set!.delete(observer);
  };
}
