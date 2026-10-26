import { StyleSheet } from 'react-native';
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
});
