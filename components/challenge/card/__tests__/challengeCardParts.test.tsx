import { Text as RNText } from 'react-native';
import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { ChallengeCard, CHALLENGE_CARD_HEIGHT } from '../ChallengeCard';
import { ChallengeCardProgress } from '../ChallengeCardProgress';
import { ChallengeCardTickRing } from '../ChallengeCardTickRing';
import { activityColors, colors } from '../../../../constants/theme';

describe('ChallengeCard', () => {
  function renderCard(props: Partial<React.ComponentProps<typeof ChallengeCard>> = {}) {
    return renderWithProviders(
      <ChallengeCard
        accentColor={activityColors.cardioLow}
        top={<RNText>badge</RNText>}
        title="Pilates challenge"
        footer={<RNText>footer</RNText>}
        {...props}
      />,
    );
  }

  it('lays out the badge, title and footer', async () => {
    const screen = await renderCard();

    expect(screen.getByText('badge')).toBeTruthy();
    expect(screen.getByText('Pilates challenge')).toBeTruthy();
    expect(screen.getByText('footer')).toBeTruthy();
  });

  it('shows the subtitle and the side panel when given, and leaves them out otherwise', async () => {
    const withBoth = await renderCard({ subtitle: 'Gym, home or studio', side: <RNText>side</RNText> });
    expect(withBoth.getByText('Gym, home or studio')).toBeTruthy();
    expect(withBoth.getByText('side')).toBeTruthy();
    await withBoth.unmount();

    const without = await renderCard();
    expect(without.queryByText('Gym, home or studio')).toBeNull();
    expect(without.queryByText('side')).toBeNull();
  });

  it('is a fixed height by default, and fills its parent when told to', async () => {
    const fixed = await renderWithProviders(
      <ChallengeCard
        accentColor={colors.neutral}
        top={null}
        title="A"
        footer={null}
      />,
    );
    expect(JSON.stringify(fixed.toJSON())).toContain(`"height":${CHALLENGE_CARD_HEIGHT}`);
    await fixed.unmount();

    const fill = await renderWithProviders(
      <ChallengeCard accentColor={colors.neutral} top={null} title="A" footer={null} sizing="fill" />,
    );
    const tree = JSON.stringify(fill.toJSON());
    expect(tree).not.toContain(`"height":${CHALLENGE_CARD_HEIGHT}`);
    expect(tree).toContain('"flex":1');
  });

  it('keeps the subtitle to one line', async () => {
    const screen = await renderCard({ subtitle: 'A long description' });

    expect(screen.getByText('A long description').props.numberOfLines).toBe(1);
  });

  it('outlines and glows in the accent color', async () => {
    const screen = await renderWithProviders(
      <ChallengeCard accentColor={activityColors.mindBody} top={null} title="A" footer={null} />,
    );
    // The outline is the accent color, softened.
    expect(JSON.stringify(screen.toJSON())).toContain(activityColors.mindBody.toUpperCase());
  });
});

describe('ChallengeCardProgress', () => {
  it('shows the day out of the total', async () => {
    const screen = await renderWithProviders(
      <ChallengeCardProgress progress={0.5} currentDay={12} totalDays={24} accentColor={activityColors.strength} />,
    );

    expect(screen.getByText(/Day 12/)).toBeTruthy();
    expect(screen.getByText(/24/)).toBeTruthy();
  });

  it('fills the bar to the progress, in the accent color', async () => {
    const screen = await renderWithProviders(
      <ChallengeCardProgress progress={0.25} currentDay={6} totalDays={24} accentColor={activityColors.strength} />,
    );
    const tree = JSON.stringify(screen.toJSON());

    expect(tree).toContain('"width":"25%"');
    expect(tree).toContain(`"backgroundColor":"${activityColors.strength}"`);
  });
});

describe('ChallengeCardProgress track', () => {
  // Over the glow (bottom edge) the groove is `ink` at 45%; over the dark (a card
  // whose glow comes from the top) it is `paper` at 12%. `withAlpha` appends the alpha byte.
  it('is a darker groove when the glow is behind it', async () => {
    const screen = await renderWithProviders(
      <ChallengeCardProgress progress={0.5} currentDay={1} totalDays={2} accentColor={activityColors.strength} />,
    );

    expect(JSON.stringify(screen.toJSON())).toContain(`"backgroundColor":"${colors.ink}73"`);
  });

  it('is a lighter groove when the card is dark behind it (the glow comes from the top)', async () => {
    const screen = await renderWithProviders(
      <ChallengeCardProgress
        progress={0.5}
        currentDay={1}
        totalDays={2}
        accentColor={activityColors.strength}
        glowEdge="top"
      />,
    );

    expect(JSON.stringify(screen.toJSON())).toContain(`"backgroundColor":"${colors.paper}1F"`);
  });
});

describe('ChallengeCardTickRing', () => {
  it('renders the content it is given in the middle', async () => {
    const screen = await renderWithProviders(
      <ChallengeCardTickRing accentColor={activityColors.functional}>
        <RNText>21</RNText>
      </ChallengeCardTickRing>,
    );

    expect(screen.getByText('21')).toBeTruthy();
  });

  it('renders for the neutral fallback color', async () => {
    const screen = await renderWithProviders(<ChallengeCardTickRing accentColor={colors.primary} />);

    expect(screen.toJSON()).toBeTruthy();
  });

  it.each(['top', 'bottom'] as const)('renders with its light coming from the %s', async (glowEdge) => {
    const screen = await renderWithProviders(
      <ChallengeCardTickRing accentColor={activityColors.functional} glowEdge={glowEdge}>
        <RNText>21</RNText>
      </ChallengeCardTickRing>,
    );

    expect(screen.getByText('21')).toBeTruthy();
  });

  it('is a 104pt ring, whatever is in the middle', async () => {
    const screen = await renderWithProviders(
      <ChallengeCardTickRing accentColor={activityColors.functional}>
        <RNText>21</RNText>
      </ChallengeCardTickRing>,
    );

    expect(JSON.stringify(screen.toJSON())).toContain('"width":104');
  });
});
