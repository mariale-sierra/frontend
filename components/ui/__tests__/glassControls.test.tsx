import 'react-native-gesture-handler/jestSetup';
import { Text as RNText } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme as render } from '../../../test-utils/renderWithTheme';
import * as Haptics from 'expo-haptics';
import { GlassInput } from '../glassInput';
import { GlassSegmentedControl } from '../glassSegmentedControl';
import { SearchBar } from '../searchBar';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const segments = [
  { key: 'mine' as const, label: 'Mine' },
  { key: 'explore' as const, label: 'Explore' },
];

describe('GlassSegmentedControl', () => {
  it('renders every segment label', async () => {
    const screen = await render(<GlassSegmentedControl segments={segments} value="mine" onChange={jest.fn()} />);
    // Each label is drawn twice (an inactive and an active layer, cross-faded).
    expect(screen.getAllByText('Mine').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Explore').length).toBeGreaterThan(0);
  });

  it('marks the current segment as selected for accessibility', async () => {
    const screen = await render(<GlassSegmentedControl segments={segments} value="explore" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Explore').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('Mine').props.accessibilityState).toEqual({ selected: false });
  });

  it('reports the new value when another segment is activated through accessibility', async () => {
    const onChange = jest.fn();
    const screen = await render(<GlassSegmentedControl segments={segments} value="mine" onChange={onChange} />);
    fireEvent(screen.getByLabelText('Explore'), 'accessibilityTap');
    expect(onChange).toHaveBeenCalledWith('explore');
  });

  it('does not report a change when the already-selected segment is activated', async () => {
    const onChange = jest.fn();
    const screen = await render(<GlassSegmentedControl segments={segments} value="mine" onChange={onChange} />);
    fireEvent(screen.getByLabelText('Mine'), 'accessibilityTap');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('GlassSegmentedControl with icon segments', () => {
  const iconSegments = [
    { key: 'posts' as const, icon: 'eye-outline' as const, accessibilityLabel: 'Posts view' },
    { key: 'photos' as const, icon: 'camera-outline' as const, accessibilityLabel: 'Photos view' },
  ];

  it('exposes each icon segment through its accessibility label', async () => {
    const screen = await render(<GlassSegmentedControl segments={iconSegments} value="photos" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Photos view').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('Posts view').props.accessibilityState).toEqual({ selected: false });
  });

  it('reports the new value when an icon segment is activated', async () => {
    const onChange = jest.fn();
    const screen = await render(<GlassSegmentedControl segments={iconSegments} value="posts" onChange={onChange} />);
    fireEvent(screen.getByLabelText('Photos view'), 'accessibilityTap');
    expect(onChange).toHaveBeenCalledWith('photos');
  });

  it('sizes itself from a fixed segment width and height', async () => {
    const screen = await render(
      <GlassSegmentedControl
        segments={iconSegments}
        value="posts"
        onChange={jest.fn()}
        segmentWidth={64}
        segmentHeight={36}
      />,
    );
    // 2 segments x 64 + one 4px gap + 4px track padding each side = 140 wide; 36 + 4 x 2 = 44 tall.
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('"width":140');
    expect(tree).toContain('"height":44');
  });
});

describe('GlassInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows its placeholder and passes typed text through', async () => {
    const onChangeText = jest.fn();
    const screen = await render(
      <GlassInput value="" onChangeText={onChangeText} placeholder="Message Sam" />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText('Message Sam'), 'hey');

    expect(onChangeText).toHaveBeenCalledWith('hey');
  });

  it('gives a light haptic on focus and still calls the caller\'s own onFocus / onBlur', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const screen = await render(
      <GlassInput value="" onChangeText={jest.fn()} placeholder="Message" onFocus={onFocus} onBlur={onBlur} />,
    );
    const field = screen.getByPlaceholderText('Message');

    await fireEvent(field, 'focus');
    await fireEvent(field, 'blur');

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('takes multiline and maxLength like Input (the chat composers)', async () => {
    const screen = await render(
      <GlassInput
        value=""
        onChangeText={jest.fn()}
        placeholder="Message"
        multiline
        maxLength={2000}
        showCounter={false}
      />,
    );
    const field = screen.getByPlaceholderText('Message');

    expect(field.props.multiline).toBe(true);
    expect(field.props.maxLength).toBe(2000);
  });

  it('renders the icons it is given', async () => {
    const screen = await render(
      <GlassInput
        value=""
        onChangeText={jest.fn()}
        placeholder="Message"
        rightIcon={<RNText>send-icon</RNText>}
      />,
    );

    expect(screen.getByText('send-icon')).toBeTruthy();
  });
});

describe('SearchBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows its placeholder', async () => {
    const screen = await render(<SearchBar value="" onChangeText={jest.fn()} placeholder="Search people" />);
    expect(screen.getByPlaceholderText('Search people')).toBeTruthy();
  });

  it('gives a light haptic when it gains focus', async () => {
    const screen = await render(<SearchBar value="" onChangeText={jest.fn()} placeholder="Search" />);
    fireEvent(screen.getByPlaceholderText('Search'), 'focus');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it('passes typed text through', async () => {
    const onChangeText = jest.fn();
    const screen = await render(<SearchBar value="" onChangeText={onChangeText} placeholder="Search" />);
    fireEvent.changeText(screen.getByPlaceholderText('Search'), 'run');
    expect(onChangeText).toHaveBeenCalledWith('run');
  });

  it('only shows the clear button once there is text, and clears with a haptic', async () => {
    const empty = await render(<SearchBar value="" onChangeText={jest.fn()} placeholder="Search" />);
    expect(empty.queryByRole('button')).toBeNull();
    empty.unmount();

    const onChangeText = jest.fn();
    const filled = await render(<SearchBar value="run" onChangeText={onChangeText} placeholder="Search" />);
    fireEvent.press(filled.getByRole('button'));
    expect(onChangeText).toHaveBeenCalledWith('');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });
});
