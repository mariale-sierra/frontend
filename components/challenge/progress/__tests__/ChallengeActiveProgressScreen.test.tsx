import { StyleSheet } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { ChallengeActiveProgressScreen } from '../ChallengeActiveProgressScreen';
import { useChallengeActiveProgress } from '../../../../hooks/useChallengeActiveProgress';
import { getChallengeAccentColor } from '../../../../services/adapters/challengeState';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: '7' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));
jest.mock('../../../../hooks/useChallengeActiveProgress', () => ({ useChallengeActiveProgress: jest.fn() }));
jest.mock('../../../../hooks/useConfirmationPopup', () => ({
  useConfirmationPopup: () => ({ show: jest.fn(), Component: () => null }),
}));
jest.mock('../../../../services/challenge/challenge.service', () => ({ leaveChallenge: jest.fn() }));
// The screen's own pieces are tested on their own; only the log button is under test here.
jest.mock('../../challengeAccentBackdrop', () => ({ ChallengeAccentBackdrop: () => null }));
jest.mock('../ChallengeProgressHeader', () => ({ ChallengeProgressHeader: () => null }));
jest.mock('../ChallengePhotoGalleryModal', () => ({ ChallengePhotoGalleryModal: () => null }));
jest.mock('../ChallengePhotoMosaicSkeleton', () => ({ ChallengePhotoMosaicSkeleton: () => null }));
jest.mock('../ChallengeWorkoutCalendar', () => ({ ChallengeWorkoutCalendar: () => null }));
jest.mock('../ConfettiBurst', () => ({ ConfettiBurst: () => null }));
jest.mock('../../../layout/screenBackground', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

function mockProgress(state: string) {
  (useChallengeActiveProgress as jest.Mock).mockReturnValue({
    loading: false,
    challengeId: '7',
    state,
    dominantActivityCategory: 'strength',
    photos: [],
    title: 'Glutes',
  });
}

describe('ChallengeActiveProgressScreen — log today button', () => {
  beforeEach(() => mockPush.mockClear());

  it.each(['active', 'rest'])('shows on a %s day and opens Log Metrics for this challenge', async (state) => {
    mockProgress(state);
    await renderWithTheme(<ChallengeActiveProgressScreen />);

    await fireEvent.press(screen.getByTestId('progress-log-today'));
    expect(mockPush).toHaveBeenCalledWith('/(add)/metrics?challengeId=7');
  });

  it("is filled with the challenge's activity color", async () => {
    mockProgress('active');
    await renderWithTheme(<ChallengeActiveProgressScreen />);

    const style = StyleSheet.flatten(screen.getByTestId('progress-log-today').props.style);
    expect(style.backgroundColor).toBe(getChallengeAccentColor('strength'));
  });

  it.each(['completed', 'won', 'left'])('is hidden once there is nothing to log (%s)', async (state) => {
    mockProgress(state);
    await renderWithTheme(<ChallengeActiveProgressScreen />);

    expect(screen.queryByTestId('progress-log-today')).toBeNull();
  });
});
