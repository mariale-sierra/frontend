export function hoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60)));
}

/** "Sunday, 23 Aug" — today's date for the Home screen greeting header. */
export function formatTodayLabel(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date());
}

/** Compact relative time ("just now", "5m", "2h", "3d") for feed/activity rows. */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.floor(diffH / 24)}d`;
}

/**
 * Day-separator pill label for chat threads (Chats-47A wireframe's "Today"
 * pill above the first message of a calendar day). Device-local calendar
 * day, not a 24h rolling window — returns a discriminated kind rather than
 * an already-localized string so the caller can run 'today'/'yesterday'
 * through i18n; a plain date only needs the two variants.
 */
export type DaySeparator = { kind: 'today' } | { kind: 'yesterday' } | { kind: 'date'; label: string };

export function getDaySeparator(iso: string): DaySeparator {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return { kind: 'today' };
  if (diffDays === 1) return { kind: 'yesterday' };
  return {
    kind: 'date',
    label: new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(date),
  };
}

/** True when two ISO timestamps fall on different device-local calendar days. */
export function isDifferentDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() !== db.getFullYear() || da.getMonth() !== db.getMonth() || da.getDate() !== db.getDate();
}
