import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { ChallengeJoinApprovedPopup } from '../ChallengeJoinApprovedPopup';
import { useChallengeJoinApprovedStore } from '../../../store/challengeJoinApprovedStore';

describe('ChallengeJoinApprovedPopup', () => {
  beforeEach(() => {
    useChallengeJoinApprovedStore.setState({ visible: false, challenge: null });
  });

  it('shows nothing until a join request is approved', async () => {
    const screen = await renderWithProviders(<ChallengeJoinApprovedPopup />);

    expect(screen.queryByText("You're in!")).toBeNull();
  });

  it('says which challenge the request was approved for', async () => {
    useChallengeJoinApprovedStore.getState().show({ challengeId: 'c1', challengeName: 'Iron Will' });
    const screen = await renderWithProviders(<ChallengeJoinApprovedPopup />);

    expect(screen.getByText("You're in!")).toBeTruthy();
    expect(screen.getByText('Your request to join "Iron Will" was approved.')).toBeTruthy();
  });

  it('closes when the CTA is pressed', async () => {
    useChallengeJoinApprovedStore.getState().show({ challengeId: 'c1', challengeName: 'Iron Will' });
    const screen = await renderWithProviders(<ChallengeJoinApprovedPopup />);

    await fireEvent.press(screen.getByText('Nice'));

    expect(useChallengeJoinApprovedStore.getState().visible).toBe(false);
  });
});
