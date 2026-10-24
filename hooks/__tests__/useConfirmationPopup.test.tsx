import { act, fireEvent } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { renderWithTheme } from '../../test-utils/renderWithTheme';
import { useConfirmationPopup, type ConfirmationPopupType } from '../useConfirmationPopup';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));

function Harness({ type, onConfirm }: { type: ConfirmationPopupType; onConfirm: () => void }) {
  const popup = useConfirmationPopup({ type, challengeName: 'Iron Will', onConfirm });
  return (
    <>
      <Pressable onPress={popup.show} testID="open">
        <Text>open</Text>
      </Pressable>
      <popup.Component />
    </>
  );
}

// Sprint 10, B2: joining a private challenge files a request, and the
// confirmation now says so instead of "Join?".
describe('useConfirmationPopup — join vs request to join', () => {
  it('a public challenge asks to join', async () => {
    const screen = await renderWithTheme(<Harness type="join" onConfirm={jest.fn()} />);
    await fireEvent.press(screen.getByTestId('open'));

    expect(screen.getByText('challenges.joinConfirm.title')).toBeTruthy();
    expect(screen.getByText('challenges.joinConfirm.confirm')).toBeTruthy();
  });

  it('a private challenge asks to send a request, and confirming runs the same join call', async () => {
    const onConfirm = jest.fn();
    const screen = await renderWithTheme(<Harness type="requestJoin" onConfirm={onConfirm} />);
    await fireEvent.press(screen.getByTestId('open'));

    expect(screen.getByText('challenges.requestJoinConfirm.title')).toBeTruthy();
    expect(screen.getByText('challenges.requestJoinConfirm.description')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('challenges.requestJoinConfirm.confirm'));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
