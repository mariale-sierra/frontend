import { render } from '@testing-library/react-native';
import { ExerciseAccentBackdrop } from '../exerciseAccentBackdrop';
import { activityColors } from '../../../constants/theme';

const mockDome = jest.fn();
jest.mock('../../ui/accentDome', () => ({
  AccentDome: (props: unknown) => {
    mockDome(props);
    return null;
  },
}));

describe('ExerciseAccentBackdrop reach', () => {
  it('lets the light reach 40% of the way down — behind the glass location badges, not fading out above them', async () => {
    await render(<ExerciseAccentBackdrop color={activityColors.strength} />);

    expect(mockDome.mock.calls[0][0].domeDepth).toBeGreaterThanOrEqual(0.4);
  });

  it('draws it from the top edge (the dome default) only', async () => {
    mockDome.mockClear();
    await render(<ExerciseAccentBackdrop color={activityColors.strength} />);

    expect(mockDome).toHaveBeenCalledTimes(1);
    expect(mockDome.mock.calls[0][0].edge ?? 'top').toBe('top');
  });
});
