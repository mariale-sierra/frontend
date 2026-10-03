import { Animated, Dimensions, StyleSheet, Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Stand-ins that say which background was chosen.
jest.mock('../MeshGradientBackground', () => {
  const { Text } = require('react-native');
  return { MeshGradientBackground: ({ look }: { look?: string }) => <Text>{`mesh-${look}`}</Text> };
});
jest.mock('../PaperGradientBackground', () => {
  const { Text } = require('react-native');
  return { PaperGradientBackground: ({ edge }: { edge?: string }) => <Text>{`paper-${edge}`}</Text> };
});
jest.mock('../PagedGradientBackground', () => {
  const { Text } = require('react-native');
  return {
    PagedGradientBackground: ({ colors, edge }: { colors: string[]; edge?: string }) => (
      <Text>{`paged-${colors.join('+')}-${edge}`}</Text>
    ),
  };
});

// The switches are read once, when the module loads, so each case loads
// `ScreenBackground` fresh with them set the way it wants.
function loadScreenBackground({ paper, vivid }: { paper: boolean; vivid: boolean }) {
  let ScreenBackground: typeof import('../screenBackground').default;
  jest.isolateModules(() => {
    jest.doMock('../../../constants/screenBackground', () => ({
      USE_PAPER_GRADIENT_BACKGROUND: paper,
      USE_VIVID_MESH_BACKGROUND: vivid,
      PAPER_GRADIENT_EDGE: 'bottom',
    }));
    ScreenBackground = require('../screenBackground').default;
  });
  return ScreenBackground!;
}

const PAGES = { colors: ['#111111', '#222222'], scrollX: new Animated.Value(0), pageWidth: 300 };

// How far up the gradient has been carried: the `translateY` of the view around it.
function gradientOffset(screen: Awaited<ReturnType<typeof render>>) {
  let offset: number | undefined;
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const { props, children } = node as { props?: { style?: unknown }; children?: unknown[] };
    const transform = StyleSheet.flatten(props?.style as never)?.transform as { translateY?: number }[] | undefined;
    if (transform?.[0]?.translateY !== undefined) offset = transform[0].translateY;
    children?.forEach(visit);
  };
  visit(screen.toJSON());
  return offset;
}

describe('ScreenBackground', () => {
  it('gives a gradient-background screen the paper light from the bottom edge by default', async () => {
    const ScreenBackground = loadScreenBackground({ paper: true, vivid: false });
    const screen = await render(
      <ScreenBackground gradientBackground>
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(screen.getByText('paper-bottom')).toBeTruthy();
    expect(screen.getByText('content')).toBeTruthy();
    expect(screen.queryByText(/mesh-/)).toBeNull();
  });

  it('lets a screen ask for the top edge instead', async () => {
    const ScreenBackground = loadScreenBackground({ paper: true, vivid: false });
    const screen = await render(
      <ScreenBackground gradientBackground gradientEdge="top">
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(screen.getByText('paper-top')).toBeTruthy();
    expect(screen.queryByText('paper-bottom')).toBeNull();
  });

  it('colors the light after the pages of a carousel when the screen has them', async () => {
    const ScreenBackground = loadScreenBackground({ paper: true, vivid: false });
    const screen = await render(
      <ScreenBackground gradientBackground gradientPages={PAGES}>
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(screen.getByText('paged-#111111+#222222-bottom')).toBeTruthy();
    expect(screen.queryByText(/paper-/)).toBeNull();
  });

  it('keeps the plain paper light while the carousel has no pages yet', async () => {
    const ScreenBackground = loadScreenBackground({ paper: true, vivid: false });
    const screen = await render(
      <ScreenBackground gradientBackground gradientPages={{ ...PAGES, colors: [] }}>
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(screen.getByText('paper-bottom')).toBeTruthy();
    expect(screen.queryByText(/paged-/)).toBeNull();
  });

  it('ignores the pages on the mesh background, which has no color to follow them with', async () => {
    const ScreenBackground = loadScreenBackground({ paper: false, vivid: false });
    const screen = await render(
      <ScreenBackground gradientBackground gradientPages={PAGES}>
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(screen.getByText('mesh-soft')).toBeTruthy();
    expect(screen.queryByText(/paged-/)).toBeNull();
  });

  describe('with the scroll offset of a list (gradientScrollY)', () => {
    async function renderWithScroll(offset: number) {
      const ScreenBackground = loadScreenBackground({ paper: true, vivid: false });
      return render(
        <ScreenBackground gradientBackground gradientScrollY={new Animated.Value(offset)}>
          <RNText>content</RNText>
        </ScreenBackground>,
      );
    }

    it('stays put at the top of the list', async () => {
      const screen = await renderWithScroll(0);

      expect(gradientOffset(screen)).toBeCloseTo(0);
    });

    it('rides up with the list as it is scrolled, instead of staying fixed behind it', async () => {
      const screen = await renderWithScroll(120);

      expect(gradientOffset(screen)).toBeCloseTo(-120);
    });

    it('is carried all the way off the screen by a screen height of scrolling, and no further', async () => {
      // The screen's own height is how far a full scroll carries it.
      const { height } = Dimensions.get('window');
      const far = await renderWithScroll(height * 3);

      expect(height).toBeGreaterThan(0);
      expect(gradientOffset(far)).toBeCloseTo(-height);
    });

    it('does not follow the list down when it is pulled past its top', async () => {
      const screen = await renderWithScroll(-80);

      expect(gradientOffset(screen)).toBeCloseTo(0);
    });

    it('still draws the same light, and the content over it', async () => {
      const screen = await renderWithScroll(40);

      expect(screen.getByText('paper-bottom')).toBeTruthy();
      expect(screen.getByText('content')).toBeTruthy();
    });
  });

  it('leaves the gradient fixed behind the screen when there is no scroll offset', async () => {
    const ScreenBackground = loadScreenBackground({ paper: true, vivid: false });
    const screen = await render(
      <ScreenBackground gradientBackground>
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(gradientOffset(screen)).toBeUndefined();
  });

  describe('with vividGradient (the create-challenge flow)', () => {
    it('gets the original vivid rainbow mesh instead of the paper light, whichever way the switches are set', async () => {
      for (const flags of [
        { paper: true, vivid: false },
        { paper: false, vivid: false },
        { paper: false, vivid: true },
      ]) {
        const ScreenBackground = loadScreenBackground(flags);
        const screen = await render(
          <ScreenBackground gradientBackground vividGradient>
            <RNText>content</RNText>
          </ScreenBackground>,
        );

        expect(screen.getByText('mesh-vivid')).toBeTruthy();
        expect(screen.queryByText(/paper-/)).toBeNull();
        expect(screen.queryByText('mesh-soft')).toBeNull();
        expect(screen.getByText('content')).toBeTruthy();
        await screen.unmount();
      }
    });

    it('leaves the other gradient screens on the paper light', async () => {
      const ScreenBackground = loadScreenBackground({ paper: true, vivid: false });
      const screen = await render(
        <ScreenBackground gradientBackground>
          <RNText>content</RNText>
        </ScreenBackground>,
      );

      expect(screen.getByText('paper-bottom')).toBeTruthy();
      expect(screen.queryByText('mesh-vivid')).toBeNull();
    });

    it('is not asked for by a screen without a gradient background at all', async () => {
      const ScreenBackground = loadScreenBackground({ paper: true, vivid: false });
      const screen = await render(
        <ScreenBackground vividGradient>
          <RNText>content</RNText>
        </ScreenBackground>,
      );

      expect(screen.queryByText('mesh-vivid')).toBeNull();
    });
  });

  it('gives the soft mesh back when the paper switch is turned off', async () => {
    const ScreenBackground = loadScreenBackground({ paper: false, vivid: false });
    const screen = await render(
      <ScreenBackground gradientBackground>
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(screen.getByText('mesh-soft')).toBeTruthy();
    expect(screen.queryByText(/paper-/)).toBeNull();
  });

  it('brings the original vivid mesh back when both switches are turned the other way', async () => {
    const ScreenBackground = loadScreenBackground({ paper: false, vivid: true });
    const screen = await render(
      <ScreenBackground gradientBackground>
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(screen.getByText('mesh-vivid')).toBeTruthy();
    expect(screen.queryByText('mesh-soft')).toBeNull();
  });

  it('leaves every other screen on the default two-glow background, whichever way the switches are set', async () => {
    for (const flags of [
      { paper: true, vivid: false },
      { paper: false, vivid: false },
      { paper: false, vivid: true },
    ]) {
      const ScreenBackground = loadScreenBackground(flags);
      const screen = await render(
        <ScreenBackground>
          <RNText>content</RNText>
        </ScreenBackground>,
      );

      expect(screen.queryByText(/mesh-/)).toBeNull();
      expect(screen.queryByText(/paper-/)).toBeNull();
      expect(screen.queryByText(/paged-/)).toBeNull();
      expect(screen.getByText('content')).toBeTruthy();
      await screen.unmount();
    }
  });
});
