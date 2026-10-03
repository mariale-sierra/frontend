import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { ConfettiBurst } from '../ConfettiBurst';

// Per explicit request 2026-09-22: a finished challenge's progress screen
// gets a confetti burst every time it's opened (see ChallengeActiveProgressScreen).
describe('ConfettiBurst', () => {
  it('renders nothing when not active', async () => {
    const screen = await renderWithProviders(<ConfettiBurst active={false} />);

    expect(screen.queryByTestId('confetti-burst')).toBeNull();
  });

  it('bursts a scatter of pieces when active', async () => {
    const screen = await renderWithProviders(<ConfettiBurst active={true} />);

    const burst = screen.getByTestId('confetti-burst');
    expect(burst).toBeTruthy();
    // A real scatter, not one placeholder piece.
    expect(burst.children.length).toBeGreaterThan(20);
  });

  it('is purely decorative — never intercepts touches on the screen behind it', async () => {
    const screen = await renderWithProviders(<ConfettiBurst active={true} />);

    expect(screen.getByTestId('confetti-burst').props.pointerEvents).toBe('none');
  });
});
