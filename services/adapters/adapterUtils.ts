export function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'active', 'joined'].includes(normalized)) return true;
  if (['false', '0', 'no', 'inactive', 'left'].includes(normalized)) return false;
  return null;
}

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z]/g, '');
}
