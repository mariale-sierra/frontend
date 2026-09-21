import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { LogMetricsExerciseCard } from '../logMetricsExerciseCard';
import { colors, glass, radius } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import type { ExerciseMetricsBlock } from '../../../types/metrics';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => (values ? `${key}:${JSON.stringify(values)}` : key),
  }),
}));

const exercise = (overrides: Partial<ExerciseMetricsBlock> = {}): ExerciseMetricsBlock => ({
  id: 'e1',
  exerciseId: 1,
  name: 'Back squat',
  activityType: 'strength',
  location: 'gym',
  notes: '',
  rows: [
    { set: 1, reps: '10', targets: { reps: 10 } },
    { set: 2, reps: '10', targets: { reps: 10 } },
  ],
  ...overrides,
});

const renderCard = async (block = exercise()) =>
  JSON.stringify((await renderWithTheme(<LogMetricsExerciseCard exercise={block} onChangeValue={jest.fn()} />)).toJSON());

describe('LogMetricsExerciseCard', () => {
  it("is frosted glass, the comments sheet's: a blur under the translucent surface tint", async () => {
    const tree = await renderCard();

    expect(tree).toContain('ExpoBlur');
    expect(tree).toContain(`"backgroundColor":"${withAlpha(colors.surface, glass.tintOpacity)}"`);
  });

  it('is not a solid `surface` card any more, so the screen behind it shows through', async () => {
    expect(await renderCard()).not.toContain(`"backgroundColor":"${colors.surface}"`);
  });

  it('keeps its shape: the medium radius and the glass rim', async () => {
    const tree = await renderCard();

    expect(tree).toContain(`"borderRadius":${radius.medium}`);
    expect(tree).toContain(`"borderColor":"${withAlpha(colors.paper, glass.borderOpacity)}"`);
  });

  it('is plain glass, without the extra light a popup has', async () => {
    const tree = await renderCard();

    expect(tree).not.toContain('glassSheen');
    expect(tree).not.toContain('glassRim');
  });

  it('still shows the exercise, its progress and a stepper for each set', async () => {
    const screen = await renderWithTheme(<LogMetricsExerciseCard exercise={exercise()} onChangeValue={jest.fn()} />);

    expect(screen.getByText('Back squat')).toBeTruthy();
    expect(screen.getAllByText('logMetrics.entry.setLabel:{"number":1}')).toHaveLength(1);
    expect(screen.getAllByText('logMetrics.entry.setLabel:{"number":2}')).toHaveLength(1);
  });
});
