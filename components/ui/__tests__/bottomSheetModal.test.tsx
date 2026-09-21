import { Text as RNText } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BottomSheetModal } from '../bottomSheetModal';
import { colors, fillOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

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
