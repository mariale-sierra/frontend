/** Same caps as the backend (src/workout-posts/hashtags/hashtag.util.ts). */
export const MAX_HASHTAG_LENGTH = 50;
export const MAX_HASHTAGS_PER_POST = 10;

// Must stay in sync with the backend's HASHTAG_RE: '#' + letters (any
// script), digits or '_', not glued to a preceding word ("abc#tag" isn't a
// tag). Group 1 is the char before the '#', group 2 the tag itself.
const HASHTAG_RE = /(^|[^\p{L}\p{N}_&#])#([\p{L}\p{N}_]+)/gu;

function isValidTag(tag: string): boolean {
  return tag.length <= MAX_HASHTAG_LENGTH && !/^\d+$/.test(tag);
}

/** Distinct tags in a caption — lowercase, no '#', first-appearance order,
 * capped like the backend so the composer's hint matches what gets saved. */
export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const tags: string[] = [];
  for (const match of text.matchAll(HASHTAG_RE)) {
    const tag = match[2].toLowerCase();
    if (!isValidTag(tag)) continue;
    if (!tags.includes(tag)) tags.push(tag);
    if (tags.length === MAX_HASHTAGS_PER_POST) break;
  }
  return tags;
}

export type CaptionSegment = { kind: 'text'; text: string } | { kind: 'hashtag'; text: string; tag: string };

/** Splits a caption into plain text and `#tag` runs, for highlighting tags
 * inline without changing the caption's own text. */
export function splitHashtags(text: string): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(HASHTAG_RE)) {
    const tag = match[2];
    if (!isValidTag(tag)) continue;
    const hashIndex = (match.index ?? 0) + match[1].length;
    if (hashIndex > cursor) segments.push({ kind: 'text', text: text.slice(cursor, hashIndex) });
    segments.push({ kind: 'hashtag', text: `#${tag}`, tag: tag.toLowerCase() });
    cursor = hashIndex + tag.length + 1;
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) });
  return segments;
}
