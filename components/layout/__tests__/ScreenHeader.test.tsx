import { StyleSheet, Text as RNText } from 'react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { ScreenHeader } from '../ScreenHeader';
import { colors, spacing, textOpacity } from '../../../constants/theme';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));

const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('ScreenHeader', () => {
  it('has the back button and a centered, bold title', async () => {
    const screen = await renderWithTheme(<ScreenHeader title="Manage challenge" />);

    expect(JSON.stringify(screen.toJSON())).toContain('chevron-back-outline');
    expect(screen.getByText('Manage challenge')).toBeTruthy();
    expect(flat(screen.getByText('Manage challenge'))).toMatchObject({ textAlign: 'center' });
  });

  it('keeps the title on one line, so a long one cannot push the header out', async () => {
    const screen = await renderWithTheme(<ScreenHeader title="A very long title" />);

    expect(screen.getByText('A very long title').props.numberOfLines).toBe(1);
  });

  it('has no subtitle unless it is given one', async () => {
    const screen = await renderWithTheme(<ScreenHeader title="Join requests" />);

    expect(screen.queryByText('Morning Run')).toBeNull();
  });

  it('has a quiet subtitle under the title: `secondary` text', async () => {
    const screen = await renderWithTheme(<ScreenHeader title="Join requests" subtitle="Morning Run" />);
    const subtitle = flat(screen.getByText('Morning Run'));

    expect(subtitle.opacity).toBe(textOpacity.secondary);
    expect(subtitle).toMatchObject({ textAlign: 'center' });
  });

  it("takes the subtitle's color, at full strength, when it is given one: the challenge's own", async () => {
    const screen = await renderWithTheme(
      <ScreenHeader title="Join requests" subtitle="Morning Run" subtitleColor={colors.rest} />,
    );

    expect(flat(screen.getByText('Morning Run'))).toMatchObject({ color: colors.rest, opacity: 1 });
  });

  it('draws what is put at its right end', async () => {
    const screen = await renderWithTheme(<ScreenHeader title="Members" trailing={<RNText>action</RNText>} />);

    expect(screen.getByText('action')).toBeTruthy();
  });

  it('keeps that end the width of the back button even when empty, so the title stays centered', async () => {
    const empty = JSON.stringify((await renderWithTheme(<ScreenHeader title="Members" />)).toJSON());

    // The back button is 44 wide, and so is the slot at the other end.
    expect(empty).toContain('"width":44');
    expect(empty).toContain('"width":44,"alignItems":"flex-end"');
  });

  it('balances the two ends: both are pulled out to the margin by the same amount', async () => {
    const tree = JSON.stringify((await renderWithTheme(<ScreenHeader title="Members" />)).toJSON());

    expect(tree).toContain(`"marginLeft":${-spacing.sm}`);
    expect(tree).toContain(`"marginRight":${-spacing.sm}`);
  });

  it('takes its margins from the spacing scale', async () => {
    const tree = JSON.stringify((await renderWithTheme(<ScreenHeader title="Members" />)).toJSON());

    expect(tree).toContain(`"paddingHorizontal":${spacing.lg}`);
    expect(tree).toContain(`"paddingTop":${spacing.lg}`);
    expect(tree).toContain(`"paddingBottom":${spacing.md}`);
  });
});
