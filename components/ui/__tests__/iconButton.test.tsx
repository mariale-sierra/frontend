import { renderWithTheme as render } from '../../../test-utils/renderWithTheme';
import { IconButton, MIN_TOUCH_TARGET } from '../iconButton';
import { BackButton } from '../backButton';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../../utils/navigation', () => ({ safeBack: jest.fn() }));

// Sprint 10 accessibility pass: icon-only buttons are announced as buttons and
// always have at least a MIN_TOUCH_TARGET touch area.
describe('IconButton accessibility', () => {
  it('is announced as a button, with its label', async () => {
    const screen = await render(<IconButton name="send" accessibilityLabel="Send" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
  });

  it('grows a small button\'s touch area to the minimum without changing its size', async () => {
    const screen = await render(<IconButton name="add-outline" size={32} accessibilityLabel="Add" onPress={jest.fn()} />);
    const button = screen.getByRole('button');

    expect(button.props.hitSlop).toBe((MIN_TOUCH_TARGET - 32) / 2);
  });

  it('adds no touch area to a button that is already big enough, and keeps an explicit hitSlop', async () => {
    const big = await render(<IconButton name="add-outline" size={44} accessibilityLabel="Add" onPress={jest.fn()} />);
    expect(big.getByRole('button').props.hitSlop).toBeUndefined();
    await big.unmount();

    const custom = await render(
      <IconButton name="add-outline" size={20} hitSlop={20} accessibilityLabel="Add" onPress={jest.fn()} />,
    );
    expect(custom.getByRole('button').props.hitSlop).toBe(20);
  });

  it('announces when it is disabled', async () => {
    const screen = await render(<IconButton name="send" accessibilityLabel="Send" disabled onPress={jest.fn()} />);

    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({ disabled: true });
  });
});

describe('BackButton accessibility', () => {
  it('reads "Back" by default', async () => {
    const screen = await render(<BackButton />);

    expect(screen.getByRole('button', { name: 'common.actions.back' })).toBeTruthy();
  });
});
