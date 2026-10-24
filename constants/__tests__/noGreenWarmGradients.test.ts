import { getMeshRecipe } from '../meshRecipes';
import type { MeshCardKind } from '../meshRecipes';
import { activityColors } from '../theme';
import { hueOf, rotateHue } from '../../utils/color';
import { toneRotation } from '../../components/ui/accentDome';

// Yellow ends and green begins around here; the warm activities' gradients stay below it.
const GREEN_START = 64;
const CARDS: MeshCardKind[] = ['mine', 'explore', 'deck', 'space', 'screen'];
const WARM = ['strength', 'cardioIntense'] as const;

describe('strength and cardio intense gradients have no green in them', () => {
  it.each(WARM)('%s: every mesh field stays orange-to-yellow', (key) => {
    for (const card of CARDS) {
      for (const blob of getMeshRecipe(card, key).blobs) {
        const hue = hueOf(rotateHue(activityColors[key], blob.hue))!;
        expect(hue).toBeLessThanOrEqual(GREEN_START);
      }
    }
  });

  it.each(WARM)("%s: the dome glow's two-tone ramp stays between gold and yellow", (key) => {
    const hue = hueOf(activityColors[key])!;
    for (const step of [-1, -0.5, 0, 0.5, 1]) {
      expect(hue + toneRotation(activityColors[key], step)).toBeLessThanOrEqual(GREEN_START + 0.5);
    }
  });

  it.each(WARM)('%s: its tones stay close together, so it reads as one color', (key) => {
    const meshHues = getMeshRecipe('screen', key).blobs.map((blob) => blob.hue);
    expect(Math.max(...meshHues) - Math.min(...meshHues)).toBeLessThanOrEqual(25);
    const rotations = [-1, 1].map((step) => toneRotation(activityColors[key], step));
    expect(Math.max(...rotations) - Math.min(...rotations)).toBeLessThanOrEqual(20);
  });

  it('only narrows warm accents — every other color keeps its ±22° ramp', () => {
    for (const key of ['cardioLow', 'flexibility', 'mindBody', 'functional'] as const) {
      expect(toneRotation(activityColors[key], 1)).toBe(22);
      expect(toneRotation(activityColors[key], -1)).toBe(-22);
    }
  });

  it('keeps depth: each still has three distinct tones', () => {
    for (const key of WARM) {
      expect(new Set(getMeshRecipe('screen', key).blobs.map((blob) => blob.hue)).size).toBe(3);
    }
  });
});
