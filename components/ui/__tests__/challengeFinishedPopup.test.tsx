import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { ChallengeFinishedPopup } from '../ChallengeFinishedPopup';
import { useChallengeFinishedStore } from '../../../store/challengeFinishedStore';

describe('ChallengeFinishedPopup', () => {
  beforeEach(() => {
    useChallengeFinishedStore.setState({ visible: false, challenge: null });
  });

  it('shows nothing until a challenge finishes', async () => {
    const screen = await renderWithProviders(<ChallengeFinishedPopup />);

    expect(screen.queryByText('Challenge complete')).toBeNull();
  });

  it('says which challenge finished, and in how many days', async () => {
    useChallengeFinishedStore.getState().show({ challengeId: 'c1', challengeName: 'Iron Will', totalDays: 75 });
    const screen = await renderWithProviders(<ChallengeFinishedPopup />);

    expect(screen.getByText('Challenge complete')).toBeTruthy();
    expect(screen.getByText('You finished "Iron Will" in 75 days.')).toBeTruthy();
  });

  it('uses the singular for a one-day challenge, and leaves the length out when it is not known', async () => {
    useChallengeFinishedStore.getState().show({ challengeId: 'c1', challengeName: 'Sprint', totalDays: 1 });
    const one = await renderWithProviders(<ChallengeFinishedPopup />);
    expect(one.getByText('You finished "Sprint" in 1 day.')).toBeTruthy();

    useChallengeFinishedStore.getState().show({ challengeId: 'c2', challengeName: 'Mystery' });
    const unknown = await renderWithProviders(<ChallengeFinishedPopup />);
    expect(unknown.getByText('You finished "Mystery".')).toBeTruthy();
  });

  it('closes when Done is pressed', async () => {
    useChallengeFinishedStore.getState().show({ challengeId: 'c1', challengeName: 'Iron Will', totalDays: 75 });
    const screen = await renderWithProviders(<ChallengeFinishedPopup />);

    await fireEvent.press(screen.getByText('Done'));

    expect(useChallengeFinishedStore.getState().visible).toBe(false);
  });
});
