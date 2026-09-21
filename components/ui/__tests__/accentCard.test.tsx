import { StyleSheet, Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';
import { AccentCard } from '../accentCard';
import { activityColors, borderWidth, colors, spacing } from '../../../constants/theme';
import { getMeshRecipe } from '../../../constants/meshRecipes';

describe('AccentCard', () => {
  it('renders its children', async () => {
    const screen = await render(
      <AccentCard color={activityColors.mindBody}>
        <RNText>Inside</RNText>
      </AccentCard>,
    );
    expect(screen.getByText('Inside')).toBeTruthy();
  });

  it('has a fine outline in the accent color at 30%, and md padding, on ink', async () => {
    const screen = await render(
      <AccentCard color={activityColors.mindBody} testID="card">
        <RNText>Inside</RNText>
      </AccentCard>,
    );
    const flat = StyleSheet.flatten(screen.getByTestId('card').props.style);

    expect(flat).toMatchObject({
      borderWidth: borderWidth.fine,
      padding: spacing.md,
      backgroundColor: colors.ink,
    });
    // The accent color at 30%: `withAlpha` appends the alpha byte (0x4D).
    expect(flat.borderColor).toBe(`${activityColors.mindBody}4D`);
  });

  it('keeps the outline and the ink base when it draws a mesh recipe', async () => {
    const screen = await render(
      <AccentCard color={activityColors.mindBody} glowRecipe={getMeshRecipe('mine', 'mindBody')} testID="card">
        <RNText>Inside</RNText>
      </AccentCard>,
    );
    const flat = StyleSheet.flatten(screen.getByTestId('card').props.style);

    // The same card as the plain-glow one: the mesh fades into the same `ink`.
    expect(flat).toMatchObject({
      borderWidth: borderWidth.fine,
      padding: spacing.md,
      backgroundColor: colors.ink,
    });
    expect(flat.borderColor).toBe(`${activityColors.mindBody}4D`);
  });

  it('draws the glow layer, which never captures touches', async () => {
    const screen = await render(
      <AccentCard color={activityColors.mindBody}>
        <RNText>Inside</RNText>
      </AccentCard>,
    );

    expect(JSON.stringify(screen.toJSON())).toContain('"pointerEvents":"none"');
  });

  it('takes its size and padding from the style passed in', async () => {
    const screen = await render(
      <AccentCard color={colors.neutral} testID="card" style={{ padding: 12, height: 100 }}>
        <RNText>Inside</RNText>
      </AccentCard>,
    );
    expect(StyleSheet.flatten(screen.getByTestId('card').props.style)).toMatchObject({ padding: 12, height: 100 });
  });
});
