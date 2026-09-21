import { Animated, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { PagedGradientBackground } from '../PagedGradientBackground';
import { activityColors } from '../../../constants/theme';

const PAGE_WIDTH = 300;

// The opacity of each light, in the order they were drawn (an Animated.View's
// style holds a plain number in the test renderer).
function lightOpacities(screen: Awaited<ReturnType<typeof render>>) {
  const opacities: number[] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const { props, children } = node as { props?: { style?: unknown }; children?: unknown[] };
    const opacity = StyleSheet.flatten(props?.style as never)?.opacity;
    if (typeof opacity === 'number') opacities.push(opacity);
    children?.forEach(visit);
  };
  visit(screen.toJSON());
  return opacities;
}

function renderPaged(colorsPerPage: string[], offset: number) {
  return render(
    <PagedGradientBackground colors={colorsPerPage} scrollX={new Animated.Value(offset)} pageWidth={PAGE_WIDTH} />,
  );
}

describe('PagedGradientBackground', () => {
  it('does not capture touches, so the screen above it stays usable', async () => {
    const screen = await renderPaged([activityColors.strength, activityColors.cardioLow], 0);

    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });

  it('shows the light of the page in view, and none of the others', async () => {
    const first = await renderPaged([activityColors.strength, activityColors.cardioLow], 0);
    const second = await renderPaged([activityColors.strength, activityColors.cardioLow], PAGE_WIDTH);

    expect(lightOpacities(first)).toEqual([1, 0]);
    expect(lightOpacities(second)).toEqual([0, 1]);
  });

  it('cross-fades between two pages as the carousel scrolls between them', async () => {
    const halfway = await renderPaged([activityColors.strength, activityColors.cardioLow], PAGE_WIDTH / 2);

    expect(lightOpacities(halfway)).toEqual([0.5, 0.5]);
  });

  it('holds on the last page however far past it the carousel is pulled', async () => {
    const past = await renderPaged([activityColors.strength, activityColors.cardioLow], PAGE_WIDTH * 3);
    const before = await renderPaged([activityColors.strength, activityColors.cardioLow], -PAGE_WIDTH);

    expect(lightOpacities(past)).toEqual([0, 1]);
    expect(lightOpacities(before)).toEqual([1, 0]);
  });

  it('draws one light per color, however many pages share it', async () => {
    const colorsPerPage = [activityColors.strength, activityColors.cardioLow, activityColors.strength];
    const onFirst = await renderPaged(colorsPerPage, 0);
    const onLast = await renderPaged(colorsPerPage, PAGE_WIDTH * 2);
    const between = await renderPaged(colorsPerPage, PAGE_WIDTH * 1.5);

    // Two lights, not three: the strength light is in view on the first and last pages.
    expect(lightOpacities(onFirst)).toEqual([1, 0]);
    expect(lightOpacities(onLast)).toEqual([1, 0]);
    expect(lightOpacities(between)).toEqual([0.5, 0.5]);
  });

  it('holds a single page steady, with nothing to scroll between', async () => {
    const screen = await renderPaged([activityColors.mindBody], PAGE_WIDTH * 4);

    expect(lightOpacities(screen)).toEqual([1]);
  });
});
