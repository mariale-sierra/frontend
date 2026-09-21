import { Image, StyleSheet } from 'react-native';
import { screen, waitFor, within } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import ExerciseDetailScreen from '../[id]';
import { getExerciseDetail, getMuscleDetail } from '../../../services/exercises/exercises.service';
import type { ExerciseDetail } from '../../../services/exercises/exercises.service';
import { activityColors, colors } from '../../../constants/theme';
import { LOCATION_ICON_NAME } from '../../../components/icons/locationIcon';
import { MuscleAnatomyView } from '../../../components/anatomy/muscleAnatomyView';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ id: '7' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
// The real English copy, looked up the way i18next does: a key with no translation
// gives the caller's `defaultValue`, else the raw key itself (the bug to catch).
jest.mock('react-i18next', () => {
  const en = require('../../../i18n/resources/en').default;
  const lookup = (key: string): string | undefined =>
    key.split('.').reduce((node: any, part) => node?.[part], en);
  return {
    useTranslation: () => ({
      t: (key: string, options?: { defaultValue?: string }) => lookup(key) ?? options?.defaultValue ?? key,
      i18n: { language: 'en' },
    }),
  };
});
jest.mock('../../../services/exercises/exercises.service', () => ({
  getExerciseDetail: jest.fn(),
  getMuscleDetail: jest.fn(),
}));
// The real body map, spied on: what color the screen asks it to draw in.
jest.mock('../../../components/anatomy/muscleAnatomyView', () => {
  const actual = jest.requireActual('../../../components/anatomy/muscleAnatomyView');
  return { ...actual, MuscleAnatomyView: jest.fn(actual.MuscleAnatomyView) };
});
// The screen's backdrop is its own concern (exerciseAccentBackdrop.test.tsx).
jest.mock('../../../components/layout/screenBackground', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../../../components/exercises/exerciseAccentBackdrop', () => ({
  ExerciseAccentBackdrop: () => null,
}));

const EXERCISE: ExerciseDetail = {
  id: 7,
  slug: 'barbell-squat',
  name: 'Barbell Squat',
  description: 'A compound lower-body lift.',
  instructions: ['Brace.', 'Squat.'],
  tips: [],
  region: null,
  categories: [
    { code: 'strength', name: 'Strength', isPrimary: true },
    { code: 'functional', name: 'Functional', isPrimary: false },
  ],
  locations: [
    { code: 'gym', name: 'Gym', isPrimary: true },
    { code: 'home', name: 'Home', isPrimary: false },
  ],
  muscles: [],
  assets: [],
  metrics: [],
};

async function renderScreen(exercise: ExerciseDetail = EXERCISE) {
  (getExerciseDetail as jest.Mock).mockResolvedValue(exercise);
  (getMuscleDetail as jest.Mock).mockResolvedValue({ svgParts: [] });
  await renderWithTheme(<ExerciseDetailScreen />);
  await waitFor(() => expect(screen.getByText(exercise.name)).toBeTruthy());
}

// The pill that holds a label: the label's text, its content row, then the pill.
const pillOf = (label: string) => screen.getByText(label).parent!.parent!;
const fillOf = (label: string) => StyleSheet.flatten(pillOf(label).props.style).backgroundColor;

// The props of the icon beside a badge's label: the Ionicon next to the label's text in
// the pill's content row, read off the rendered tree.
type Rendered = { type: string; props: Record<string, unknown>; children?: (Rendered | string)[] | null };
const iconBeside = (label: string): Record<string, unknown> | undefined => {
  const search = (node: Rendered | string | null): Record<string, unknown> | undefined => {
    if (!node || typeof node === 'string') return undefined;
    const kids = node.children ?? [];
    const labelled = kids.some((kid) => typeof kid !== 'string' && kid.type === 'Text' && kid.children?.[0] === label);
    if (labelled) {
      const icon = kids.find((kid) => typeof kid !== 'string' && kid.type === 'Ionicons') as Rendered | undefined;
      return icon?.props;
    }
    for (const kid of kids) {
      const found = search(kid);
      if (found) return found;
    }
    return undefined;
  };
  return search(screen.toJSON() as unknown as Rendered);
};
const iconOf = (label: string) => iconBeside(label)?.name;

// The centered line a badge sits on: the first ancestor that centers its children.
const lineOf = (label: string) => {
  let node = pillOf(label).parent;
  while (node && StyleSheet.flatten(node.props.style)?.justifyContent !== 'center') node = node.parent;
  return node!;
};

// What the screen shows, top to bottom: each text's words and each picture's uri.
const contentInOrder = (): string[] => {
  const found: string[] = [];
  const walk = (node: Rendered | string | null) => {
    if (!node || typeof node === 'string') return;
    if (node.type === 'Text' && typeof node.children?.[0] === 'string') found.push(node.children[0] as string);
    if (node.type === 'Image') found.push(`image:${(node.props.source as { uri: string }).uri}`);
    node.children?.forEach(walk);
  };
  walk(screen.toJSON() as unknown as Rendered);
  return found;
};
const PICTURE_URI = 'https://example.com/squat.jpg';
const WITH_PICTURE: ExerciseDetail = { ...EXERCISE, assets: [{ type: 'main', url: PICTURE_URI }] };

describe('ExerciseDetailScreen', () => {
  // The picture asks for its own size; the test environment has no image to measure.
  let getSize: jest.SpyInstance;
  beforeEach(() => {
    getSize = jest.spyOn(Image, 'getSize').mockImplementation(((_uri: string, success: (w: number, h: number) => void) => {
      success(800, 600);
    }) as never);
  });
  afterEach(() => {
    getSize.mockRestore();
  });

  it('names the exercise once, at the top — not again in a header', async () => {
    await renderScreen();

    expect(screen.getAllByText('Barbell Squat')).toHaveLength(1);
  });

  it('shows the activity badges on one line and the location badges on the line below, apart', async () => {
    await renderScreen();

    const activityLine = lineOf('Strength');
    const locationLine = lineOf('Gym');

    // Both activities are on the first line, both locations on the second — never mixed.
    expect(within(activityLine).getByText('Functional')).toBeTruthy();
    expect(within(activityLine).queryByText('Gym')).toBeNull();
    expect(within(locationLine).getByText('Home')).toBeTruthy();
    expect(within(locationLine).queryByText('Strength')).toBeNull();
  });

  it("fills each activity badge with that activity's own color", async () => {
    await renderScreen();

    expect(fillOf('Strength')).toBe(activityColors.strength);
    expect(fillOf('Functional')).toBe(activityColors.functional);
  });

  it('makes the location badges frosted glass — no activity color, no solid fill', async () => {
    await renderScreen();

    // One blur per location badge, none behind the activity badges.
    expect(JSON.stringify(screen.toJSON()).match(/ExpoBlur/g)).toHaveLength(EXERCISE.locations.length);
    expect(fillOf('Gym')).toBeUndefined();
    expect(fillOf('Home')).toBeUndefined();
    expect(fillOf('Strength')).toBe(activityColors.strength);
  });

  it('sets the location badges\' icon and label in paper', async () => {
    await renderScreen();

    for (const label of ['Gym', 'Home']) {
      expect(StyleSheet.flatten(screen.getByText(label).props.style).color).toBe(colors.paper);
      expect(iconBeside(label)?.color).toBe(colors.paper);
    }
  });

  it("shows the live catalog's 'cualquier-lugar' as Anywhere, with its icon — not as a raw translation key", async () => {
    await renderScreen({
      ...EXERCISE,
      locations: [{ code: 'cualquier-lugar', name: 'Cualquier lugar', isPrimary: true }],
    });

    expect(screen.getByText('Anywhere')).toBeTruthy();
    expect(screen.queryByText(/exerciseCatalog/)).toBeNull();
    expect(iconOf('Anywhere')).toBe(LOCATION_ICON_NAME.anywhere);
  });

  it("shows the catalog's own name for a code it has no translation for, never the raw key", async () => {
    await renderScreen({
      ...EXERCISE,
      categories: [{ code: 'aquatics', name: 'Aquatics', isPrimary: true }],
      locations: [{ code: 'pool', name: 'Swimming pool', isPrimary: true }],
    });

    expect(screen.getByText('Aquatics')).toBeTruthy();
    expect(screen.getByText('Swimming pool')).toBeTruthy();
    expect(screen.queryByText(/exerciseCatalog/)).toBeNull();
  });

  it("reads an underscored category code ('cardio_intense') as the live catalog's 'cardio-intense'", async () => {
    await renderScreen({
      ...EXERCISE,
      categories: [{ code: 'cardio_intense', name: 'Cardio Intense', isPrimary: true }],
    });

    expect(fillOf('Cardio Intense')).toBe(activityColors.cardioIntense);
  });

  it('never shows a raw translation key on any badge of a full exercise', async () => {
    await renderScreen();

    expect(screen.queryByText(/exerciseCatalog\./)).toBeNull();
  });

  it('sets the section titles in paper, in capitals', async () => {
    await renderScreen();

    for (const title of ['Description', 'Instructions']) {
      const style = StyleSheet.flatten(screen.getByText(title).props.style);

      expect(style.color).toBe(colors.paper);
      expect(style.opacity).toBe(1);
      expect(style.textTransform).toBe('uppercase');
    }
  });

  it('puts the picture under the description — not at the top of the screen', async () => {
    await renderScreen(WITH_PICTURE);
    const order = contentInOrder();
    const at = (content: string) => order.indexOf(content);

    expect(at(`image:${PICTURE_URI}`)).toBeGreaterThan(at('A compound lower-body lift.'));
    expect(at(`image:${PICTURE_URI}`)).toBeLessThan(at('Instructions'));
    // Nothing above the name but the back button: the name is the first text.
    expect(order[0]).toBe('Barbell Squat');
  });

  it('draws the picture smaller than the content, centered, and whole', async () => {
    await renderScreen(WITH_PICTURE);
    const node = JSON.stringify(screen.toJSON());
    const style = JSON.parse(/"style":(\[[^\]]*"aspectRatio"[^\]]*\]|\{[^}]*"aspectRatio"[^}]*\})/.exec(node)![1]);
    const flat = StyleSheet.flatten(style);

    expect(flat.width).toBe('60%');
    expect(flat.alignSelf).toBe('center');
    expect(node).toContain('"resizeMode":"contain"');
  });

  it('shows no picture when the exercise has none', async () => {
    await renderScreen();

    expect(contentInOrder().some((content) => content.startsWith('image:'))).toBe(false);
  });

  describe('body map', () => {
    // The colors the body map was asked to highlight in, over every render so far.
    const colorsAsked = () => (MuscleAnatomyView as jest.Mock).mock.calls.map(([props]: [{ color?: string }]) => props.color);

    beforeEach(() => {
      (MuscleAnatomyView as jest.Mock).mockClear();
    });

    it("highlights the muscles in the exercise's own activity color, not the default orange", async () => {
      await renderScreen();

      expect(colorsAsked()).toContain(activityColors.strength);
      expect(colorsAsked()).not.toContain(colors.secondary);
    });

    it("follows the exercise's primary category: cardio-low highlights in cardio-low", async () => {
      await renderScreen({
        ...EXERCISE,
        categories: [
          { code: 'strength', name: 'Strength', isPrimary: false },
          { code: 'cardio-low', name: 'Cardio Low', isPrimary: true },
        ],
      });

      expect(colorsAsked()).toContain(activityColors.cardioLow);
      expect(colorsAsked()).not.toContain(activityColors.strength);
    });
  });
});
