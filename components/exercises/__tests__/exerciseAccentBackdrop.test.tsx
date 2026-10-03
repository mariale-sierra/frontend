import { render } from '@testing-library/react-native';
import { ExerciseAccentBackdrop } from '../exerciseAccentBackdrop';
import { activityColors } from '../../../constants/theme';

describe('ExerciseAccentBackdrop', () => {
  it('does not capture touches', async () => {
    const screen = await render(<ExerciseAccentBackdrop color={activityColors.strength} />);

    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });

  it('draws the accent light from the top of the screen alone — nothing rises from the bottom', async () => {
    const screen = await render(<ExerciseAccentBackdrop color={activityColors.cardioLow} />);
    const tree = JSON.stringify(screen.toJSON());

    // One half-moon: a dithered wash and a dithered bloom, two gradients.
    expect(tree.match(/"dither":true/g)).toHaveLength(2);
  });
});
