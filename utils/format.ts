/** "1.2k" for 1200, "860" for 860 — used for member counts (Challenges-Explore). */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  const thousands = value / 1000;
  const rounded = Math.round(thousands * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}k`;
}

/**
 * "HIP THRUST" → "Hip Thrust", for display. The shared exercise-library
 * catalog (`exercises.name` in the backend) stores names in all caps — real
 * data, not a font/styling bug (confirmed on Routine-Detail: it read as
 * "no font" because every exercise name rendered shouty-uppercase against
 * the wireframe's plain-case design).
 *
 * Only touches a string that's ENTIRELY uppercase (no lowercase letters at
 * all) — anything with any lowercase already is left untouched, so a name
 * that's already correctly cased, including one with a deliberate acronym
 * (e.g. "VO2 max intervals"), is never touched. A genuinely all-caps name
 * with an acronym inside it (e.g. "VO2 MAX INTERVALS") will lose that
 * acronym's casing ("Vo2 Max Intervals") — an accepted tradeoff, since the
 * alternative (leaving it shouting) is worse and there's no way to tell
 * "intentional acronym" from "whole name happens to be in caps" from the
 * string alone.
 */
export function toTitleCase(value: string): string {
  if (/[a-z]/.test(value)) return value;
  // Split/capitalize-per-word rather than a `\b`-based regex replace: JS's
  // `\b` treats accented letters as non-word characters (it's an ASCII-only
  // `\w` under the hood, even with the `u` flag), so it inserts spurious
  // word boundaries around every accented letter and over-capitalizes
  // ("BÚLGARA" → "BÚLgara" instead of "Búlgara"). Splitting on whitespace
  // and capitalizing each word's first character directly sidesteps that.
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}
