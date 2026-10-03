import { StyleSheet } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import Camera from '../camera';
import { getChallenge, getChallengeUsers } from '../../../services/challenge/challenge.service';
import { submitWorkoutProgress } from '../../../services/workout-log/workout-log.service';
import { uploadImageAsync } from '../../../services/uploads/upload.service';
import { useMetricsEntryStore } from '../../../store/metricsEntryStore';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return { router, useRouter: () => router, useFocusEffect: () => undefined, useIsFocused: () => true };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({
    t: (key: string, values?: { count?: number }) => (values?.count !== undefined ? `${key}:${values.count}` : key),
  }),
}));
// The camera: a view that takes a picture when asked.
jest.mock('expo-camera', () => {
  const { forwardRef, useImperativeHandle } = require('react');
  return {
    CameraView: forwardRef((_props: unknown, ref: unknown) => {
      useImperativeHandle(ref, () => ({ takePictureAsync: jest.fn().mockResolvedValue({ uri: 'file:///photo.jpg' }) }));
      return null;
    }),
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ userId: 'owner-1' }) }));
jest.mock('../../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock('../../../services/challenge/challenge.service', () => ({
  ...jest.requireActual('../../../services/challenge/challenge.service'),
  getChallenge: jest.fn(),
  getChallengeUsers: jest.fn(),
}));
jest.mock('../../../services/workout-log/workout-log.service', () => ({ submitWorkoutProgress: jest.fn() }));
jest.mock('../../../services/uploads/upload.service', () => ({ uploadImageAsync: jest.fn() }));
jest.mock('../../../services/metrics/applyExerciseMetrics', () => ({ applyExerciseMetrics: jest.fn() }));
jest.mock('../../../hooks/useChallengeProgress', () => ({ invalidateChallengeProgressCache: jest.fn() }));
jest.mock('../../../utils/progressLoggedFeedback', () => ({ showProgressLoggedFeedback: jest.fn() }));

const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

const OWNER = { created_by_user_id: 'owner-1' };
const SOMEONE_ELSE = { created_by_user_id: 'someone-else' };
const participants = [
  { id: 'owner-1', username: 'me', role: 'owner', status: 'active' },
  { id: 'ana', username: 'ana', role: 'member', status: 'active' },
  { id: 'bruno', username: 'bruno', role: 'member', status: 'active' },
];

// Opens the camera on a challenge, and takes the picture: the view with the chips on the photo.
async function takePhoto(challenge: Record<string, unknown> = OWNER) {
  useMetricsEntryStore.setState({ selectedChallengeId: 'ch-1', exerciseMetrics: [], currentRoutineId: null });
  (getChallenge as jest.Mock).mockResolvedValue({ id: 'ch-1', name: 'Morning Run', ...challenge });
  (getChallengeUsers as jest.Mock).mockResolvedValue(participants);
  (uploadImageAsync as jest.Mock).mockResolvedValue('https://example.com/photo.jpg');
  (submitWorkoutProgress as jest.Mock).mockResolvedValue({ id: 1 });

  const screen = await renderWithTheme(<Camera />);
  await fireEvent.press(screen.getByTestId('camera-capture'));
  await waitFor(() => expect(screen.getByText('camera.visibilityFollowers')).toBeTruthy());
  return screen;
}

describe('the camera — the chips on the photo', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('the visibility chip', () => {
    it('is there for everyone, top right, and toggles between followers and private', async () => {
      const screen = await takePhoto(SOMEONE_ELSE);

      await fireEvent.press(screen.getByText('camera.visibilityFollowers'));

      expect(screen.getByText('camera.visibilityPrivate')).toBeTruthy();
      expect(JSON.stringify(screen.toJSON())).toContain('eye-off-outline');
    });
  });

  describe('the tag chip — for the challenge\'s owner', () => {
    it('is there for the owner', async () => {
      const screen = await takePhoto();

      await waitFor(() => expect(screen.getByText('challengeProgress.tagParticipantsChip')).toBeTruthy());
    });

    it('is not there for anyone else, and their camera does not even ask for the participants', async () => {
      const screen = await takePhoto(SOMEONE_ELSE);
      await waitFor(() => expect(getChallenge).toHaveBeenCalled());

      expect(screen.queryByText('challengeProgress.tagParticipantsChip')).toBeNull();
      expect(getChallengeUsers).not.toHaveBeenCalled();
    });

    it('asks for the participants of the owner\'s challenge', async () => {
      await takePhoto();

      await waitFor(() => expect(getChallengeUsers).toHaveBeenCalledWith('ch-1'));
    });

    it('is short: the chip says "Tag people", not the whole sheet title, so it fits beside the visibility chip', async () => {
      const screen = await takePhoto();

      await waitFor(() => expect(screen.getByText('challengeProgress.tagParticipantsChip')).toBeTruthy());
      expect(screen.queryByText('challengeProgress.tagParticipantsLabel')).toBeNull();
    });

    it("is the visibility chip's twin: the same label style and the same icon size, not a copy of it", async () => {
      const screen = await takePhoto();
      await waitFor(() => expect(screen.getByText('challengeProgress.tagParticipantsChip')).toBeTruthy());

      expect(flat(screen.getByText('challengeProgress.tagParticipantsChip'))).toEqual(
        flat(screen.getByText('camera.visibilityFollowers')),
      );
      const tree = JSON.stringify(screen.toJSON());
      expect(tree).toContain('"name":"pricetag-outline","size":19');
      expect(tree).toContain('"name":"eye-outline","size":19');
    });

    it('opens the sheet with the participants — but not the owner, who is not someone to tag', async () => {
      const screen = await takePhoto();
      await waitFor(() => expect(screen.getByText('challengeProgress.tagParticipantsChip')).toBeTruthy());

      await fireEvent.press(screen.getByText('challengeProgress.tagParticipantsChip'));

      await waitFor(() => expect(screen.getByText('@ana')).toBeTruthy());
      expect(screen.getByText('@bruno')).toBeTruthy();
      expect(screen.queryByText('@me')).toBeNull();
    });

    it('shows how many are tagged on the chip once some are', async () => {
      const screen = await takePhoto();
      await waitFor(() => expect(screen.getByText('challengeProgress.tagParticipantsChip')).toBeTruthy());

      await fireEvent.press(screen.getByText('challengeProgress.tagParticipantsChip'));
      await waitFor(() => expect(screen.getByText('@ana')).toBeTruthy());
      await fireEvent.press(screen.getByText('@ana'));
      await fireEvent.press(screen.getByText('@bruno'));
      await fireEvent.press(screen.getByText('common.actions.done'));

      await waitFor(() => expect(screen.getAllByText('challengeProgress.tagParticipantsSelectedCount:2').length).toBeGreaterThan(0));
    });
  });

  describe('sending the photo', () => {
    it('tags who was picked, for the owner', async () => {
      const screen = await takePhoto();
      await waitFor(() => expect(screen.getByText('challengeProgress.tagParticipantsChip')).toBeTruthy());
      await fireEvent.press(screen.getByText('challengeProgress.tagParticipantsChip'));
      await waitFor(() => expect(screen.getByText('@ana')).toBeTruthy());
      await fireEvent.press(screen.getByText('@ana'));
      await fireEvent.press(screen.getByText('common.actions.done'));

      await fireEvent.press(screen.getByTestId('camera-confirm'));

      await waitFor(() => expect(submitWorkoutProgress).toHaveBeenCalled());
      expect(submitWorkoutProgress).toHaveBeenCalledWith(expect.objectContaining({ taggedUserIds: ['ana'] }));
    });

    it('tags no one when none was picked', async () => {
      const screen = await takePhoto();
      await waitFor(() => expect(screen.getByText('challengeProgress.tagParticipantsChip')).toBeTruthy());

      await fireEvent.press(screen.getByTestId('camera-confirm'));

      await waitFor(() => expect(submitWorkoutProgress).toHaveBeenCalled());
      expect((submitWorkoutProgress as jest.Mock).mock.calls[0][0].taggedUserIds).toBeUndefined();
    });

    it('never tags for someone who is not the owner', async () => {
      const screen = await takePhoto(SOMEONE_ELSE);
      await waitFor(() => expect(getChallenge).toHaveBeenCalled());

      await fireEvent.press(screen.getByTestId('camera-confirm'));

      await waitFor(() => expect(submitWorkoutProgress).toHaveBeenCalled());
      expect((submitWorkoutProgress as jest.Mock).mock.calls[0][0].taggedUserIds).toBeUndefined();
    });
  });
});
