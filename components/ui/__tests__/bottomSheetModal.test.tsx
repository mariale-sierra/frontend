import { StyleSheet, Text as RNText } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BottomSheetModal } from '../bottomSheetModal';
import { colors, fillOpacity, radius } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

type TreeNode = { props?: { style?: unknown }; children?: (TreeNode | string)[] | null };
const walk = (node: TreeNode | string | null): TreeNode[] =>
  !node || typeof node === 'string' ? [] : [node, ...(node.children ?? []).flatMap(walk)];

// The frosted layer is an expo-blur view: the tree names it `ExpoBlur`.
const hasBlur = (screen: Awaited<ReturnType<typeof render>>) => JSON.stringify(screen.toJSON()).includes('ExpoBlur');

async function renderSheet(glass?: boolean, onClose = jest.fn()) {
  return render(
    <BottomSheetModal visible onClose={onClose} glass={glass}>
      <RNText testID="sheet">Inside</RNText>
    </BottomSheetModal>,
  );
}

describe('BottomSheetModal', () => {
  it('is an opaque surface card by default — no blur behind its content', async () => {
    const screen = await renderSheet();

    expect(screen.getByText('Inside')).toBeTruthy();
    expect(hasBlur(screen)).toBe(false);
  });

  it('can be frosted glass instead: a blur behind its content, so the screen shows through', async () => {
    const screen = await renderSheet(true);

    expect(screen.getByText('Inside')).toBeTruthy();
    expect(hasBlur(screen)).toBe(true);
  });

  it('dims what is behind it with the ink token, not a hardcoded black', async () => {
    const screen = await renderSheet();
    const tree = JSON.stringify(screen.toJSON());

    expect(tree).toContain(withAlpha(colors.ink, fillOpacity.dim));
    expect(tree).not.toContain('rgba(0, 0, 0');
    expect(tree).not.toContain('#000000');
  });

  it('a glass sheet drops the opaque card fill, so the blur can show', async () => {
    const opaque = JSON.stringify((await renderSheet()).toJSON());
    const glass = JSON.stringify((await renderSheet(true)).toJSON());

    expect(opaque).toContain(`"backgroundColor":"${colors.surface}"`);
    expect(glass).toContain('"backgroundColor":"transparent"');
  });

  describe('the glass rim along its top', () => {
    it('has a gradient rim, lit along the top edge, when it is glass', async () => {
      const tree = JSON.stringify((await renderSheet(true)).toJSON());

      expect(tree).toContain('glassRim');
      // Only the rim: the sheen is for the popups and toasts.
      expect(tree).not.toContain('glassSheen');
    });

    it("follows the sheet's rounded top corners", async () => {
      const tree = JSON.stringify((await renderSheet(true)).toJSON());

      expect(tree).toContain(`"rx":${radius.big},"ry":${radius.big}`);
    });

    it('has the rim in place of the hairline, not as well as it', async () => {
      const glassSheet = await renderSheet(true);
      const opaqueSheet = await renderSheet();
      const own = (screen: Awaited<ReturnType<typeof render>>) =>
        walk(screen.toJSON() as unknown as TreeNode)
          .map((node) => StyleSheet.flatten(node.props?.style as never) as Record<string, unknown>)
          // The sheet itself: the view with the sheet's own corners.
          .find((style) => style?.borderTopLeftRadius === radius.big);

      expect(own(glassSheet)?.borderWidth).toBe(0);
      // (The opaque card has never had a border.)
      expect(own(opaqueSheet)?.borderWidth).toBeUndefined();
    });

    it('has no rim when it is the opaque card', async () => {
      const tree = JSON.stringify((await renderSheet()).toJSON());

      expect(tree).not.toContain('glassRim');
      expect(tree).not.toContain('RNSVG');
    });

    it('keeps the rim under the content, so the sheet can still be used', async () => {
      const tree = JSON.stringify((await renderSheet(true)).toJSON());

      expect(tree.indexOf('glassRim')).toBeLessThan(tree.indexOf('Inside'));
    });
  });

  it('renders nothing while it is closed', async () => {
    const screen = await render(
      <BottomSheetModal visible={false} onClose={jest.fn()} glass>
        <RNText>Inside</RNText>
      </BottomSheetModal>,
    );

    expect(screen.queryByText('Inside')).toBeNull();
  });

  it('closes when the area outside the sheet is tapped', async () => {
    const onClose = jest.fn();
    const screen = await renderSheet(true, onClose);

    await fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when the sheet itself is tapped', async () => {
    const onClose = jest.fn();
    const screen = await renderSheet(true, onClose);

    await fireEvent.press(screen.getByText('Inside'));

    expect(onClose).not.toHaveBeenCalled();
  });
});
