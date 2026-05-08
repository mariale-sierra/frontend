export function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return hex;
  }

  const value = Math.max(0, Math.min(1, alpha));
  const suffix = Math.round(value * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `#${normalized}${suffix}`;
}
