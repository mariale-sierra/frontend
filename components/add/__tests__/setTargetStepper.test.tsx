import { StyleSheet } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { SetTargetStepper } from '../setTargetStepper';
import { colors, fillOpacity, radius, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

const baseProps = {
  value: 10,
  unitLabel: 'reps',
  adjusted: false,
  step: 1,
  onIncrease: jest.fn(),
  onDecrease: jest.fn(),
  onChangeValue: jest.fn(),
};

type TreeNode = { type?: string; props?: { style?: unknown }; children?: (TreeNode | string)[] | null };

const walk = (node: TreeNode | string | null): TreeNode[] =>
  !node || typeof node === 'string' ? [] : [node, ...(node.children ?? []).flatMap(walk)];

// The first view of the stepper: the pill everything else sits in.
function pillStyle(): Record<string, unknown> {
  const root = screen.toJSON() as TreeNode;
  return StyleSheet.flatten(root.props?.style as never) as Record<string, unknown>;
}

describe('SetTargetStepper', () => {
  beforeEach(() => jest.clearAllMocks());

  // The same soft chip fill as the selected option of the Mine / Explore toggle.
  it('is a soft, lighter gray than the card: the translucent `paper` chip fill of the toggle', async () => {
    await renderWithTheme(<SetTargetStepper {...baseProps} />);

    expect(pillStyle().backgroundColor).toBe(withAlpha(colors.paper, fillOpacity.chip));
  });

  it('is neither the old solid `ink` slot nor a plain `surface` card', async () => {
    await renderWithTheme(<SetTargetStepper {...baseProps} />);

    expect(pillStyle().backgroundColor).not.toBe(colors.ink);
    expect(pillStyle().backgroundColor).not.toBe(colors.surface);
  });

  it('keeps its rectangle: the same radius, height and border width as before', async () => {
    await renderWithTheme(<SetTargetStepper {...baseProps} />);

    expect(pillStyle()).toMatchObject({ borderRadius: radius.small, height: 44, borderWidth: 1.5 });
  });

  // Every label in it is `paper` at the full-strength text tier, so none gets lost on the lighter fill.
  it('sets every label in it in `paper`, none dimmed to the tertiary tier', async () => {
    await renderWithTheme(<SetTargetStepper {...baseProps} />);
    const texts = walk(screen.toJSON() as TreeNode).filter((node) => node.type === 'Text');
    const styles = texts.map((node) => StyleSheet.flatten(node.props?.style as never) as Record<string, unknown>);

    // The value and its unit.
    expect(styles).toHaveLength(2);
    for (const style of styles) {
      expect(style.color).toBe(colors.paper);
      expect(style.opacity).toBe(textOpacity.primary);
    }
  });

  it('sets the minus icon in `paper` too', async () => {
    await renderWithTheme(<SetTargetStepper {...baseProps} />);

    expect(JSON.stringify(screen.toJSON())).toContain(`"name":"remove-outline","size":16,"color":"${colors.paper}"`);
  });

  it('keeps the value `paper` while it is being typed', async () => {
    await renderWithTheme(<SetTargetStepper {...baseProps} />);

    await fireEvent.press(screen.getByText(/10/));

    const field = screen.getByDisplayValue('10');
    expect(StyleSheet.flatten(field.props.style)).toMatchObject({ color: colors.paper, opacity: textOpacity.primary });
  });

  it('has no outline of its own until the set is adjusted, then lights up `success` — unchanged', async () => {
    const { rerender } = await renderWithTheme(<SetTargetStepper {...baseProps} />);
    expect(pillStyle().borderColor).toBe('transparent');

    await rerender(<SetTargetStepper {...baseProps} adjusted />);
    expect(pillStyle().borderColor).toBe(colors.success);
  });

  // The border keeps its width in both states, so adjusting a set does not nudge the row.
  it('keeps the same border width whether or not the set is adjusted, so nothing shifts', async () => {
    const { rerender } = await renderWithTheme(<SetTargetStepper {...baseProps} />);
    const idle = pillStyle().borderWidth;

    await rerender(<SetTargetStepper {...baseProps} adjusted />);

    expect(pillStyle().borderWidth).toBe(idle);
  });

  it('still shows the value with its unit, and steps it up and down', async () => {
    await renderWithTheme(<SetTargetStepper {...baseProps} />);

    expect(screen.getByText(/10/)).toBeTruthy();
    expect(screen.getByText(/reps/)).toBeTruthy();
  });

  it('swaps the value for a numeric field when tapped, and commits what was typed', async () => {
    const onChangeValue = jest.fn();
    await renderWithTheme(<SetTargetStepper {...baseProps} onChangeValue={onChangeValue} />);

    await fireEvent.press(screen.getByText(/10/));
    const field = screen.getByDisplayValue('10');
    await fireEvent.changeText(field, '25');
    await fireEvent(field, 'submitEditing');

    expect(onChangeValue).toHaveBeenCalledWith(25);
  });
});
