/**
 * Living documentation of the "every i18n key goes in en.ts AND es.ts" rule
 * (see root CLAUDE.md / docs/ai CONVENTIONS.md). Fails loudly the moment the
 * two resource files drift apart, instead of silently falling back to the
 * key string (or the wrong language) at runtime.
 */
import en from '../resources/en';
import es from '../resources/es';

/** Recursively collects dotted key paths for every leaf (non-object) value. */
function collectKeyPaths(node: unknown, prefix = ''): string[] {
  if (node === null || typeof node !== 'object') {
    return [prefix];
  }

  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    collectKeyPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('i18n resource parity (en.ts vs es.ts)', () => {
  it('should have exactly the same set of keys in en.ts and es.ts', () => {
    const enKeys = new Set(collectKeyPaths(en));
    const esKeys = new Set(collectKeyPaths(es));

    const missingInEs = [...enKeys].filter((k) => !esKeys.has(k)).sort();
    const missingInEn = [...esKeys].filter((k) => !enKeys.has(k)).sort();

    expect({ missingInEs, missingInEn }).toEqual({ missingInEs: [], missingInEn: [] });
  });

  it('should not have any empty string values in either resource file', () => {
    const emptyEnKeys = collectKeyPathsWithValue(en).filter(([, v]) => v === '');
    const emptyEsKeys = collectKeyPathsWithValue(es).filter(([, v]) => v === '');

    expect(emptyEnKeys.map(([k]) => k)).toEqual([]);
    expect(emptyEsKeys.map(([k]) => k)).toEqual([]);
  });
});

function collectKeyPathsWithValue(node: unknown, prefix = ''): Array<[string, unknown]> {
  if (node === null || typeof node !== 'object') {
    return [[prefix, node]];
  }

  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    collectKeyPathsWithValue(value, prefix ? `${prefix}.${key}` : key),
  );
}
