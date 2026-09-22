import { MESH_FALLOFF } from '../../components/ui/accentMesh';
import { getMeshRecipe, MESH_RECIPES } from '../meshRecipes';
import type { MeshArch, MeshBlob, MeshCardKind, MeshRecipeKey } from '../meshRecipes';

const CARD_KINDS: MeshCardKind[] = ['mine', 'explore', 'deck', 'screen', 'space'];
// The kinds made of a few huge fields: the Spaces' card is a scatter of small orbs, which has tests of its own.
const FIELD_KINDS = CARD_KINDS.filter((kind) => kind !== 'space');
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
const FIELD_PAIRS = FIELD_KINDS.flatMap((kind) => KEYS.map((key) => [kind, key] as const));

// A field's size is a fraction of the card's width; a card is about this tall for
// its width (a Space card, `space`, about 140 tall on a 342 wide card): Mine and Explore 176 tall on a ~342 wide card, the log picker's little
// square (`deck`) about as tall as it is wide, and a phone's screen (`screen`) a bit
// more than twice as tall as it is wide.
const ASPECT: Record<MeshCardKind, number> = { mine: 0.52, explore: 0.52, deck: 1.1, screen: 2.16, space: 0.42 };
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

// How much of the arch's `ink` there is at a point, given as fractions of the screen's
// width and height — the same shape as a field, level.
function archAt(arch: MeshArch, x: number, y: number, aspect: number) {
  return Math.min(1, arch.peak * falloff(Math.hypot((x - arch.x) / arch.rx, ((y - arch.y) * aspect) / arch.ry)));
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

  it.each(FIELD_PAIRS)('%s / %s is three fields — few colors, widely spaced', (kind, key) => {
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

  it.each(FIELD_PAIRS)('%s / %s has very large fields — the main one wider than the card', (kind, key) => {
    const { blobs } = getMeshRecipe(kind, key);

    expect(Math.max(...blobs.map((blob) => blob.rx))).toBeGreaterThanOrEqual(1);
    for (const blob of blobs) {
      expect(blob.rx).toBeGreaterThanOrEqual(0.45);
      expect(blob.ry).toBeGreaterThanOrEqual(0.25);
    }
  });

  it.each(FIELD_PAIRS)('%s / %s is unequal — one field dominates and another barely shows', (kind, key) => {
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

    // Thresholds lowered 2026-09-22 alongside `LAYOUTS.mine`'s own peaks —
    // see that recipe's doc comment: the whole thing reads noticeably
    // dimmer now, on purpose (repeatedly, across three rounds of feedback),
    // so "some color" is checked against that new, much lower baseline
    // instead of the pre-dim one.
    expect(glowAt(blobs, 0.95, 0.08)).toBeGreaterThan(0.05);
    expect(glowAt(blobs, 0.05, 0.96)).toBeGreaterThan(0.05);
  });

  it.each(KEYS)('Mine (%s) stretches the top-right corner glow toward the middle of the card', (key) => {
    const { blobs } = getMeshRecipe('mine', key);
    const corner = blobs.find((blob) => blob.x >= 0.9 && blob.y <= 0.25)!;

    // Long, and turned to lean down and toward the left...
    expect(corner.rx).toBeGreaterThanOrEqual(0.7);
    expect(corner.angle).toBeLessThan(-5);
    expect(corner.angle).toBeGreaterThan(-45);
    // ...so there is glow left of the photo tile, on the way from the corner to the middle.
    // Threshold lowered alongside `LAYOUTS.mine`'s peaks — see above.
    expect(glowAt(blobs, 0.6, 0.3)).toBeGreaterThan(0.035);
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

  describe('the screen backdrop', () => {
    // The fallback is a quieter, monochrome one.
    const scaleOf = (key: MeshRecipeKey) => (key === 'default' ? 0.6 : 1);
    // What is left of the color at a point once the arch has been cut out of it.
    const lit = (key: MeshRecipeKey, x: number, y: number) => {
      const { blobs, arch } = getMeshRecipe('screen', key);
      const cut = arch ? archAt(arch, x, y, ASPECT.screen) : 0;
      return glowAt(blobs, x, y, ASPECT.screen) * (1 - cut);
    };
    // How far down a column the color goes: where it has fallen to a faint tenth.
    const depth = (key: MeshRecipeKey, x: number) => {
      let y = 0.02;
      while (y < 1 && lit(key, x, y) > 0.1 * scaleOf(key)) y += 0.01;
      return y;
    };

    it.each(KEYS)('(%s) has its light at the TOP: lit along the whole top, bleeding down toward the middle, the bottom left dark', (key) => {
      // Lit across the top, the middle of it too (no dark gap)...
      for (const x of [0.05, 0.5, 0.95]) {
        expect(lit(key, x, 0.03)).toBeGreaterThan(0.12 * scaleOf(key));
      }
      // ...still lit a third of the way down...
      expect(lit(key, 0.5, 0.2)).toBeGreaterThan(0.03 * scaleOf(key));
      expect(lit(key, 0.05, 0.3)).toBeGreaterThan(0.03 * scaleOf(key));
      // ...much more at the top than half way down...
      expect(lit(key, 0.5, 0.03)).toBeGreaterThan(lit(key, 0.5, 0.5) * 3);
      // ...and by the bottom only a trace is left, which the bottom bar covers.
      expect(lit(key, 0.5, 0.9)).toBeLessThan(0.02);
      expect(lit(key, 0.05, 0.95)).toBeLessThan(0.02);
    });

    it.each(KEYS)('(%s) is an INVERTED half-moon: the color ends in an arch, lower down the sides than in the middle', (key) => {
      // The color reaches further down at both edges than in the middle.
      expect(depth(key, 0.05)).toBeGreaterThan(depth(key, 0.5) + 0.04);
      expect(depth(key, 0.95)).toBeGreaterThan(depth(key, 0.5) + 0.04);
    });

    it.each(KEYS)('(%s) carves the arch with a dome of ink, centered and low on the screen', (key) => {
      const { arch } = getMeshRecipe('screen', key);

      expect(arch).toBeDefined();
      expect(arch!.x).toBe(0.5);
      // Its center is in the lower half of the screen, below the color it cuts into.
      expect(arch!.y).toBeGreaterThan(0.5);
      expect(arch!.y).toBeLessThanOrEqual(1);
      expect(arch!.peak).toBeGreaterThan(0.9);
      expect(arch!.peak).toBeLessThanOrEqual(1);
      // Big, like the fields, and taller than it is wide (the screen is), so it eases in slowly.
      expect(arch!.rx).toBeGreaterThanOrEqual(0.45);
      expect(arch!.ry).toBeGreaterThan(arch!.rx);
    });

    it.each(KEYS)('(%s) leaves the very top of the arch faint, so the top of the screen is lit all along', (key) => {
      const { arch } = getMeshRecipe('screen', key);

      expect(archAt(arch!, 0.5, 0.02, ASPECT.screen)).toBeLessThan(0.1);
    });

    it.each(KEYS)('(%s) is focused on the edges: fields come in from opposite sides of the screen', (key) => {
      const [first, second] = [...getMeshRecipe('screen', key).blobs].sort((a, b) => b.peak - a.peak);

      expect(Math.abs(first.x - second.x)).toBeGreaterThan(0.8);
      expect(Math.sign(first.angle)).not.toBe(Math.sign(second.angle));
    });

    it.each(KEYS)('(%s) has no scrim and no top fade: the text sits on the color', (key) => {
      const { scrim, topFade } = getMeshRecipe('screen', key);

      expect(scrim.peak).toBe(0);
      expect(topFade).toBeUndefined();
    });

    it.each(KEYS)('(%s) has a composition of its own, not Mine, Explore or Deck', (key) => {
      const screen = JSON.stringify(getMeshRecipe('screen', key));

      for (const kind of ['mine', 'explore', 'deck'] as const) {
        expect(screen).not.toBe(JSON.stringify(getMeshRecipe(kind, key)));
      }
    });

    it.each(['mine', 'explore', 'deck'] as const)('leaves the arch to the screen: %s has none', (kind) => {
      for (const key of KEYS) {
        expect(getMeshRecipe(kind, key).arch).toBeUndefined();
      }
    });
  });

  describe('the space card — orbs, not fields', () => {
    const orbsOf = (key: MeshRecipeKey) => getMeshRecipe('space', key).blobs;
    const at = (key: MeshRecipeKey, x: number, y: number) => glowAt(orbsOf(key), x, y, ASPECT.space);
    const scaleOf = (key: MeshRecipeKey) => (key === 'default' ? 0.6 : 1);

    it.each(KEYS)('(%s) is a scatter of orbs — more of them than the other cards have fields', (key) => {
      expect(orbsOf(key).length).toBeGreaterThanOrEqual(6);
      for (const kind of FIELD_KINDS) {
        expect(orbsOf(key).length).toBeGreaterThan(getMeshRecipe(kind, key).blobs.length);
      }
    });

    it.each(KEYS)('(%s) has ROUND orbs: as wide as they are tall, and never tilted', (key) => {
      for (const orb of orbsOf(key)) {
        expect(orb.rx).toBeCloseTo(orb.ry, 5);
        expect(orb.angle).toBe(0);
      }
    });

    it.each(KEYS)('(%s) has orbs, not washes: none as big as the card is wide', (key) => {
      for (const orb of orbsOf(key)) {
        expect(orb.rx).toBeLessThanOrEqual(0.5);
        expect(orb.rx).toBeGreaterThanOrEqual(0.08);
      }
    });

    it.each(KEYS)('(%s) has orbs of different sizes: the biggest at least twice the smallest', (key) => {
      const sizes = orbsOf(key).map((orb) => orb.rx);

      expect(Math.max(...sizes) / Math.min(...sizes)).toBeGreaterThanOrEqual(2);
    });

    it.each(KEYS)('(%s) uses all three hues of its palette, over and over', (key) => {
      const hues = new Set(orbsOf(key).map((orb) => orb.hue));

      // (The fallback is a monochrome one: its three hues are all no rotation at all.)
      expect(hues.size).toBe(key === 'default' ? 1 : 3);
    });

    it.each(KEYS)('(%s) scatters them across the whole card: both sides, top and bottom', (key) => {
      const xs = orbsOf(key).map((orb) => orb.x);
      const ys = orbsOf(key).map((orb) => orb.y);

      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(0.6);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(0.6);
    });

    it.each(KEYS)('(%s) has its biggest orb away from the text: in the bottom-right, whatever the key', (key) => {
      const biggest = orbsOf(key).reduce((best, orb) => (orb.rx > best.rx ? orb : best));

      expect(biggest.x).toBeGreaterThan(0.6);
      expect(biggest.y).toBeGreaterThan(0.6);
      // It is the strongest too: the dominant one.
      expect(biggest.peak).toBe(Math.max(...orbsOf(key).map((orb) => orb.peak)));
    });

    it.each(KEYS)('(%s) keeps the name and description calm: dim behind them, brighter at the bottom-right', (key) => {
      // The name and the description run along the top-left.
      expect(at(key, 0.25, 0.25)).toBeLessThanOrEqual(0.25 * scaleOf(key));
      expect(at(key, 0.85, 0.85)).toBeGreaterThan(at(key, 0.25, 0.25) * 1.5);
    });

    it.each(KEYS)('(%s) is lit all round: some orb light in every corner and along the top and bottom', (key) => {
      for (const [x, y] of [[0.95, 0.1], [0.9, 0.9], [0.55, 0.05], [0.4, 0.95]] as const) {
        expect(at(key, x, y)).toBeGreaterThan(0.08 * scaleOf(key));
      }
    });

    it.each(KEYS)('(%s) is not mirrored: the text side is the left whatever the key', (key) => {
      const biggest = orbsOf(key).reduce((best, orb) => (orb.rx > best.rx ? orb : best));

      expect(biggest.x).toBeGreaterThan(0.5);
    });

    it.each(KEYS)('(%s) has a scrim over the text side, light', (key) => {
      const { scrim } = getMeshRecipe('space', key);

      expect(scrim.peak).toBeGreaterThan(0);
      expect(scrim.peak).toBeLessThanOrEqual(0.25);
    });

    it.each(KEYS)('(%s) has a composition of its own, not Mine, Explore, Deck or the screen', (key) => {
      const space = JSON.stringify(getMeshRecipe('space', key));

      for (const kind of FIELD_KINDS) {
        expect(space).not.toBe(JSON.stringify(getMeshRecipe(kind, key)));
      }
    });
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
