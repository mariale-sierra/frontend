import { extractHashtags, MAX_HASHTAGS_PER_POST, splitHashtags } from '../hashtags';

describe('extractHashtags', () => {
  it('returns distinct lowercase tags without #, in order', () => {
    expect(extractHashtags('Día 3 #Running y #legday #running')).toEqual(['running', 'legday']);
  });

  it('keeps accents and underscores', () => {
    expect(extractHashtags('#Pierna_Día #canción')).toEqual(['pierna_día', 'canción']);
  });

  it('ignores tags glued to a word, digit-only tags and empty input', () => {
    expect(extractHashtags('abc#tag #1 # nada')).toEqual([]);
    expect(extractHashtags(undefined)).toEqual([]);
  });

  it('caps the number of tags', () => {
    const caption = Array.from({ length: 15 }, (_, i) => `#t${i}`).join(' ');
    expect(extractHashtags(caption)).toHaveLength(MAX_HASHTAGS_PER_POST);
  });
});

describe('splitHashtags', () => {
  it('splits text and tags, preserving the original text', () => {
    const segments = splitHashtags('Hoy #LegDay, ¡vamos! #run');
    expect(segments).toEqual([
      { kind: 'text', text: 'Hoy ' },
      { kind: 'hashtag', text: '#LegDay', tag: 'legday' },
      { kind: 'text', text: ', ¡vamos! ' },
      { kind: 'hashtag', text: '#run', tag: 'run' },
    ]);
    expect(segments.map((s) => s.text).join('')).toBe('Hoy #LegDay, ¡vamos! #run');
  });

  it('leaves non-tags as plain text', () => {
    expect(splitHashtags('abc#tag #1')).toEqual([{ kind: 'text', text: 'abc#tag #1' }]);
  });
});
