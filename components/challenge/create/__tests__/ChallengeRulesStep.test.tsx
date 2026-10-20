import { StyleSheet } from 'react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { ChallengeRulesStep } from '../ChallengeRulesStep';
import { activityColors, colors } from '../../../../constants/theme';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('ChallengeRulesStep (create challenge, last step)', () => {
  it('lists the three rules: a daily photo, consistency, and doing it together', async () => {
    const screen = await renderWithTheme(<ChallengeRulesStep accentColor={activityColors.strength} />);

    for (const key of ['dailyPhoto', 'consistency', 'together']) {
      expect(screen.getByText(`challengeCreate.rules.${key}.title`)).toBeTruthy();
      expect(screen.getByText(`challengeCreate.rules.${key}.body`)).toBeTruthy();
    }
  });

  it("has a camera badge in the challenge's accent color with an ink icon", async () => {
    const screen = await renderWithTheme(<ChallengeRulesStep accentColor={activityColors.strength} />);
    const json = JSON.stringify(screen.toJSON());

    expect(json).toContain(`"name":"camera","size":32,"color":"${colors.ink}"`);
    const badge = screen.getByTestId('challenge-rules').props.children[0];
    expect(StyleSheet.flatten(badge.props.style).backgroundColor).toBe(activityColors.strength);
  });
});
