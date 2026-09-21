import { MESH_FALLOFF } from '../../components/ui/accentMesh';
import { getMeshRecipe, MESH_RECIPES } from '../meshRecipes';
import type { MeshBlob, MeshCardKind, MeshRecipeKey } from '../meshRecipes';

const CARD_KINDS: MeshCardKind[] = ['mine', 'explore', 'deck'];
const KEYS: MeshRecipeKey[] = [
  'strength',
  'cardioIntense',
  'cardioLow',
  'flexibility',
  'mindBody',
  'functional',
  'rest',
  'completed',
  'default',
];
const ACTIVITIES = KEYS.slice(0, 6);

// Every recipe of a kind, as [kind, key] pairs, for `it.each`.
const ALL = CARD_KINDS.flatMap((kind) => KEYS.map((key) => [kind, key] as const));

// A field's size is a fraction of the card's width; a card is about this tall for
// its width: Mine and Explore 176 tall on a ~342 wide card, the log picker's little
// square (`deck`) about as tall as it is wide.
const ASPECT: Record<MeshCardKind, number> = { mine: 0.52, explore: 0.52, deck: 1.1 };
const CARD_ASPECT = ASPECT.mine;

// The mesh's "center of mass": each field's position weighted by how strong and big it is.
function centerOfMass(kind: MeshCardKind, key: MeshRecipeKey) {
  const { blobs } = getMeshRecipe(kind, key);
  const weight = (blob: MeshBlob) => blob.peak * blob.rx * blob.ry;
  const total = blobs.reduce((sum, blob) => sum + weight(blob), 0);
  return {
    x: blobs.reduce((sum, blob) => sum + blob.x * weight(blob), 0) / total,
    y: blobs.reduce((sum, blob) => sum + blob.y * weight(blob), 0) / total,
  };
}

// The share of a field's peak at a distance from its core (0 = core, 1 = edge), the
// way `AccentMesh` eases it out.
function falloff(distance: number) {
  if (distance >= 1) return 0;
  const next = MESH_FALLOFF.findIndex(([position]) => distance <= position);
  const [fromPosition, fromShare] = MESH_FALLOFF[next - 1] ?? MESH_FALLOFF[0];
  const [toPosition, toShare] = MESH_FALLOFF[next];
  return fromShare + ((toShare - fromShare) * (distance - fromPosition)) / (toPosition - fromPosition || 1);
}

// The glow's added-up alpha (no scrims) at a point of the card, given as fractions
// of its width and height — what `AccentMesh` adds together with `plus`.
function glowAt(blobs: MeshBlob[], x: number, y: number, aspect = CARD_ASPECT) {
  const total = blobs.reduce((sum, blob) => {
    const dx = x - blob.x;
    const dy = (y - blob.y) * aspect;
    const angle = (blob.angle * Math.PI) / 180;
    const along = (dx * Math.cos(angle) + dy * Math.sin(angle)) / blob.rx;
    const across = (-dx * Math.sin(angle) + dy * Math.cos(angle)) / blob.ry;
    return sum + blob.peak * falloff(Math.hypot(along, across));
  }, 0);
  return Math.min(1, total);
}

describe('MESH_FALLOFF', () => {
  it('runs from full strength at the core to nothing at the edge, without ever rising', () => {
    expect(MESH_FALLOFF[0]).toEqual([0, 1]);
    expect(MESH_FALLOFF[MESH_FALLOFF.length - 1]).toEqual([1, 0]);
    for (let index = 1; index < MESH_FALLOFF.length; index += 1) {
      expect(MESH_FALLOFF[index][0]).toBeGreaterThan(MESH_FALLOFF[index - 1][0]);
      expect(MESH_FALLOFF[index][1]).toBeLessThan(MESH_FALLOFF[index - 1][1]);
    }
  });

  it('starts fading straight away and trails off in a long tail, not strong until a boundary', () => {
    // No plateau round the core, and under half strength by halfway out...
    expect(falloff(0.1)).toBeLessThan(0.98);
    expect(falloff(0.2)).toBeLessThan(0.9);
    expect(falloff(0.5)).toBeLessThan(0.5);
    // ...but a long tail rather than a cliff: still a little left near the edge.
    expect(falloff(0.8)).toBeGreaterThan(0.05);
    expect(falloff(0.9)).toBeGreaterThan(0.02);
  });

  it('never steps down by much at a time, so there is no visible edge', () => {
    for (let index = 1; index < MESH_FALLOFF.length; index += 1) {
      expect(MESH_FALLOFF[index - 1][1] - MESH_FALLOFF[index][1]).toBeLessThanOrEqual(0.16);
    }
  });
});

describe('MESH_RECIPES', () => {
  it.each(CARD_KINDS)('has a recipe for every activity, the rest and completed states, and the fallback (%s)', (kind) => {
    expect(Object.keys(MESH_RECIPES[kind]).sort()).toEqual([...KEYS].sort());
  });

  it.each(ALL)('%s / %s is three fields — few colors, widely spaced', (kind, key) => {
    expect(getMeshRecipe(kind, key).blobs).toHaveLength(3);
  });

  it.each(ALL)('%s / %s keeps every value in a sane range', (kind, key) => {
    const { blobs, scrim, topFade } = getMeshRecipe(kind, key);

    for (const blob of blobs) {
      expect(blob.peak).toBeGreaterThan(0);
      expect(blob.peak).toBeLessThanOrEqual(1);
      expect(blob.rx).toBeGreaterThan(0);
      expect(blob.ry).toBeGreaterThan(0);
      expect(Math.abs(blob.hue)).toBeLessThanOrEqual(180);
      expect(blob.x).toBeGreaterThan(-0.2);
      expect(blob.x).toBeLessThan(1.2);
    }
    for (const fade of [scrim, topFade].filter((value) => value !== undefined)) {
      expect(fade.peak).toBeGreaterThanOrEqual(0);
      expect(fade.peak).toBeLessThanOrEqual(1);
      expect(fade.reach).toBeGreaterThan(0);
      expect(fade.reach).toBeLessThanOrEqual(1);
    }
  });

  it.each(ALL)('%s / %s has very large fields — the main one wider than the card', (kind, key) => {
    const { blobs } = getMeshRecipe(kind, key);

    expect(Math.max(...blobs.map((blob) => blob.rx))).toBeGreaterThanOrEqual(1);
    for (const blob of blobs) {
      expect(blob.rx).toBeGreaterThanOrEqual(0.45);
      expect(blob.ry).toBeGreaterThanOrEqual(0.25);
    }
  });

  it.each(ALL)('%s / %s is unequal — one field dominates and another barely shows', (kind, key) => {
    const { blobs } = getMeshRecipe(kind, key);
    const peaks = blobs.map((blob) => blob.peak);
    const biggest = blobs.reduce((best, blob) => (blob.rx * blob.ry > best.rx * best.ry ? blob : best));

    expect(Math.max(...peaks) / Math.min(...peaks)).toBeGreaterThanOrEqual(2.5);
    expect(Math.min(...peaks)).toBeLessThanOrEqual(0.2);
    // The dominant field is the biggest and the strongest.
    expect(biggest.peak).toBe(Math.max(...peaks));
  });

  it.each(ALL)('%s / %s is dim, as if seen through tinted glass — never neon', (kind, key) => {
    const { blobs } = getMeshRecipe(kind, key);

    // About the strength of the dome light behind the Challenge-Info / progress
    // screens (a wash of 0.39 and a bloom of 0.26 over it) at its very strongest.
    for (const blob of blobs) {
      expect(blob.peak).toBeLessThanOrEqual(0.4);
    }
    // Added up where the fields overlap, still well short of that anywhere.
    for (let y = 0; y <= 1; y += 0.1) {
      for (let x = 0; x <= 1; x += 0.1) {
        expect(glowAt(blobs, x, y, ASPECT[kind])).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it.each(ALL)('%s / %s fades into the card gently with a light scrim', (kind, key) => {
    expect(getMeshRecipe(kind, key).scrim.peak).toBeLessThanOrEqual(0.35);
  });

  it.each(KEYS)('Mine (%s) is weighted toward the right and the bottom', (key) => {
    const { x, y } = centerOfMass('mine', key);

    expect(x).toBeGreaterThan(0.55);
    expect(y).toBeGreaterThan(0.7);
  });

  it.each(KEYS)('Mine (%s) has a huge field along the whole bottom', (key) => {
    const { blobs } = getMeshRecipe('mine', key);

    expect(blobs.some((blob) => blob.y >= 0.95 && blob.rx >= 1)).toBe(true);
  });

  it.each(KEYS)('Mine (%s) has some color in the top-right corner, and in the bottom-left', (key) => {
    const { blobs } = getMeshRecipe('mine', key);

    expect(glowAt(blobs, 0.95, 0.08)).toBeGreaterThan(0.1);
    expect(glowAt(blobs, 0.05, 0.96)).toBeGreaterThan(0.1);
  });

  it.each(KEYS)('Mine (%s) stretches the top-right corner glow toward the middle of the card', (key) => {
    const { blobs } = getMeshRecipe('mine', key);
    const corner = blobs.find((blob) => blob.x >= 0.9 && blob.y <= 0.25)!;

    // Long, and turned to lean down and toward the left...
    expect(corner.rx).toBeGreaterThanOrEqual(0.7);
    expect(corner.angle).toBeLessThan(-5);
    expect(corner.angle).toBeGreaterThan(-45);
    // ...so there is glow left of the photo tile, on the way from the corner to the middle.
    expect(glowAt(blobs, 0.6, 0.3)).toBeGreaterThan(0.08);
  });

  it.each(KEYS)('Explore (%s) is centered on the bottom and middle, not pushed into a corner', (key) => {
    const { x, y } = centerOfMass('explore', key);

    expect(Math.abs(x - 0.5)).toBeLessThan(0.12);
    expect(y).toBeGreaterThan(0.7);
  });

  it.each(KEYS)('Explore (%s) has its dominant field in the middle', (key) => {
    const { blobs } = getMeshRecipe('explore', key);
    const strongest = blobs.reduce((best, blob) => (blob.peak > best.peak ? blob : best));

    expect(strongest.x).toBeGreaterThan(0.3);
    expect(strongest.x).toBeLessThan(0.7);
  });

  it.each(KEYS)('Explore (%s) has some color in both bottom corners, and keeps the top-right clear for the ring', (key) => {
    const { blobs } = getMeshRecipe('explore', key);

    expect(glowAt(blobs, 0.05, 0.96)).toBeGreaterThan(0.1);
    expect(glowAt(blobs, 0.95, 0.96)).toBeGreaterThan(0.1);
    expect(glowAt(blobs, 0.85, 0.15)).toBeLessThan(0.1);
  });

  it.each(KEYS)('Explore (%s) fades a lot toward the top; Mine has no top fade', (key) => {
    const { topFade } = getMeshRecipe('explore', key);

    expect(topFade?.peak).toBeGreaterThanOrEqual(0.8);
    expect(topFade?.reach).toBeGreaterThanOrEqual(0.8);
    expect(getMeshRecipe('mine', key).topFade).toBeUndefined();
  });

  it.each(KEYS)('Deck (%s) has its light at the TOP: the top edge lit, the bottom left dark', (key) => {
    const { blobs } = getMeshRecipe('deck', key);
    const at = (x: number, y: number) => glowAt(blobs, x, y, ASPECT.deck);
    // The fallback is a quieter, monochrome one.
    const scale = key === 'default' ? 0.6 : 1;

    expect(at(0.5, 0.03)).toBeGreaterThan(0.2 * scale);
    expect(at(0.5, 0.97)).toBeLessThan(0.1);
    // Much more color along the top than along the bottom.
    expect(at(0.5, 0.03)).toBeGreaterThan(at(0.5, 0.97) * 3);
    expect(at(0.3, 0.05)).toBeGreaterThan(at(0.3, 0.95) * 3);
    expect(at(0.7, 0.05)).toBeGreaterThan(at(0.7, 0.95) * 3);
  });

  it.each(KEYS)('Deck (%s) comes in from both top corners — two ribbons that cross', (key) => {
    const { blobs } = getMeshRecipe('deck', key);
    const scale = key === 'default' ? 0.6 : 1;

    expect(glowAt(blobs, 0.05, 0.06, ASPECT.deck)).toBeGreaterThan(0.1 * scale);
    expect(glowAt(blobs, 0.95, 0.1, ASPECT.deck)).toBeGreaterThan(0.1 * scale);
    // Long fields, tilted opposite ways: they cross.
    const [first, second] = [...blobs].sort((a, b) => b.peak - a.peak);
    expect(Math.sign(first.angle)).not.toBe(Math.sign(second.angle));
  });

  it.each(KEYS)('Deck (%s) needs no fade from the top — the top is where the color is', (key) => {
    expect(getMeshRecipe('deck', key).topFade).toBeUndefined();
  });

  it.each(KEYS)('gives Deck a composition of its own, not Mine or Explore (%s)', (key) => {
    const deck = JSON.stringify(getMeshRecipe('deck', key));

    expect(deck).not.toBe(JSON.stringify(getMeshRecipe('mine', key)));
    expect(deck).not.toBe(JSON.stringify(getMeshRecipe('explore', key)));
  });

  it.each(KEYS)('gives Mine and Explore different compositions for %s', (key) => {
    expect(JSON.stringify(getMeshRecipe('mine', key))).not.toBe(JSON.stringify(getMeshRecipe('explore', key)));
  });

  it.each(CARD_KINDS)('gives each activity its own gradient on %s, not the same one recolored', (kind) => {
    const signatures = ACTIVITIES.map((key) => JSON.stringify(getMeshRecipe(kind, key)));

    expect(new Set(signatures).size).toBe(ACTIVITIES.length);
  });

  it('builds each recipe once, so the same object comes back every time', () => {
    expect(getMeshRecipe('mine', 'strength')).toBe(getMeshRecipe('mine', 'strength'));
  });
});
