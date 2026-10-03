import 'react-native-gesture-handler/jestSetup';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme as render } from '../../../test-utils/renderWithTheme';
import { PostsViewToggle } from '../PostsViewToggle';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('PostsViewToggle', () => {
  it('marks the current view as selected', async () => {
    const screen = await render(<PostsViewToggle view="photos" onViewChange={jest.fn()} />);
    expect(screen.getByLabelText('profile.photosViewA11y').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('profile.postsViewA11y').props.accessibilityState).toEqual({ selected: false });
  });

  it('switches view when the other icon is activated', async () => {
    const onViewChange = jest.fn();
    const screen = await render(<PostsViewToggle view="posts" onViewChange={onViewChange} />);
    fireEvent(screen.getByLabelText('profile.photosViewA11y'), 'accessibilityTap');
    expect(onViewChange).toHaveBeenCalledWith('photos');
  });
});
