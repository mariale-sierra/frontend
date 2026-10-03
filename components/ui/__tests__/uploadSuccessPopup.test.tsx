import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { UploadSuccessPopup } from '../UploadSuccessPopup';
import { useUploadSuccessStore } from '../../../store/uploadSuccessStore';

// Per explicit request 2026-09-22: "whenever you log in a day, I want the
// confetti effect please" — this popup is the shared "logged!" moment for
// both a photo upload and a rest-day submission (see
// utils/progressLoggedFeedback.ts).
describe('UploadSuccessPopup', () => {
  beforeEach(() => {
    useUploadSuccessStore.setState({ visible: false });
  });

  it('shows nothing until a day is logged', async () => {
    const screen = await renderWithProviders(<UploadSuccessPopup />);

    expect(screen.queryByTestId('confetti-burst')).toBeNull();
  });

  it('bursts confetti once a day is logged', async () => {
    useUploadSuccessStore.getState().show();
    const screen = await renderWithProviders(<UploadSuccessPopup />);

    expect(screen.getByTestId('confetti-burst')).toBeTruthy();
  });
});
