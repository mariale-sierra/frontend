import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { ProfileHeader } from '../ProfileHeader';
import { activityColors, colors, radius } from '../../../constants/theme';

// Sprint 10: the profile's practice badges use the Challenges activity filter
// chip's look — `surface` pill, bold `paper` label — with the activity icon in
// its own color after the label.
const styleOf = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

async function renderHeader(practices: string[]) {
  return renderWithProviders(
    <ProfileHeader displayName="Ana" username="ana" followersCount={0} followingCount={0} practices={practices} />,
  );
}

describe('ProfileHeader — practice badges', () => {
  it('are surface pills with the label in paper, not the activity color', async () => {
    const screen = await renderHeader(['Weightlifting']);

    expect(styleOf(screen.getByTestId('practice-badge-Weightlifting'))).toMatchObject({
      backgroundColor: colors.surface,
      borderRadius: radius.big,
    });
    expect(styleOf(screen.getByText('Weightlifting')).color).not.toBe(activityColors.strength);
  });

  it('put the activity icon, in the activity color, after the label', async () => {
    const screen = await renderHeader(['Boxing']);
    const json = JSON.stringify(screen.toJSON());
    const badgeStart = json.indexOf('"testID":"practice-badge-Boxing"');
    const labelAt = json.indexOf('"Boxing"', badgeStart);
    const iconAt = json.indexOf(`"color":"${activityColors.cardioIntense}"`, labelAt);

    expect(badgeStart).toBeGreaterThan(-1);
    expect(labelAt).toBeGreaterThan(-1);
    expect(iconAt).toBeGreaterThan(-1);
    expect(labelAt).toBeLessThan(iconAt);
  });

  it('leave out a practice that is no longer an option', async () => {
    const screen = await renderHeader(['Weightlifting', 'Not a practice']);

    expect(screen.queryByText('Not a practice')).toBeNull();
  });

  // Sprint 10: one row of interests by default; "Show more" unfolds the rest.
  describe('folding to one row', () => {
    const layout = (height: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width: 300, height } } });
    const wrapOf = (screen: Awaited<ReturnType<typeof renderHeader>>) => screen.getByTestId('practice-badge-Weightlifting').parent!;

    it('shows one row and a "Show more" toggle when the interests wrap past it', async () => {
      const screen = await renderHeader(['Weightlifting', 'Boxing', 'HIIT', 'Running']);
      await fireEvent(screen.getByTestId('practice-badge-Weightlifting'), 'layout', layout(36));
      await fireEvent(wrapOf(screen), 'layout', layout(76));

      const toggle = screen.getByTestId('practices-toggle');
      expect(toggle.props.accessibilityState).toEqual(expect.objectContaining({ expanded: false }));
      expect(styleOf(wrapOf(screen).parent!)).toMatchObject({ maxHeight: 36, overflow: 'hidden' });

      await fireEvent.press(toggle);

      expect(screen.getByTestId('practices-toggle').props.accessibilityState).toEqual(expect.objectContaining({ expanded: true }));
      expect((styleOf(wrapOf(screen).parent!) ?? {}).maxHeight).toBeUndefined();
    });

    it('has no toggle when they all fit on one row', async () => {
      const screen = await renderHeader(['Weightlifting', 'Boxing']);
      await fireEvent(screen.getByTestId('practice-badge-Weightlifting'), 'layout', layout(36));
      await fireEvent(wrapOf(screen), 'layout', layout(36));

      expect(screen.queryByTestId('practices-toggle')).toBeNull();
    });
  });
});
