import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { LogMetricsExerciseCard } from '../logMetricsExerciseCard';
import { colors, glass } from '../../../constants/theme';
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
  // Sprint 10: the frosted-glass card behind each exercise was removed.
  it('has no card behind it: no blur, no surface tint, no rim', async () => {
    const tree = await renderCard();

    expect(tree).not.toContain('ExpoBlur');
    expect(tree).not.toContain(`"backgroundColor":"${withAlpha(colors.surface, glass.tintOpacity)}"`);
    expect(tree).not.toContain(`"borderColor":"${withAlpha(colors.paper, glass.borderOpacity)}"`);
  });

  it('is numbered by its place in the routine', async () => {
    const screen = await renderWithTheme(
      <LogMetricsExerciseCard exercise={exercise()} position={3} onChangeValue={jest.fn()} />,
    );

    expect(screen.getByTestId('log-metrics-exercise-number')).toHaveTextContent('3');
  });

  it('still shows the exercise, its progress and a stepper for each set', async () => {
    const screen = await renderWithTheme(<LogMetricsExerciseCard exercise={exercise()} onChangeValue={jest.fn()} />);

    expect(screen.getByText('Back squat')).toBeTruthy();
    expect(screen.getAllByText('logMetrics.entry.setLabel:{"number":1}')).toHaveLength(1);
    expect(screen.getAllByText('logMetrics.entry.setLabel:{"number":2}')).toHaveLength(1);
  });

  // Sprint 10: untouched sets are saved at their target too, so the header no
  // longer counts changes nor fills a green check once every set is changed.
  it('shows how many sets and the target, not an adjusted-so-far count', async () => {
    const screen = await renderWithTheme(
      <LogMetricsExerciseCard
        exercise={exercise({
          rows: [
            { set: 1, reps: '12', targets: { reps: 10 } },
            { set: 2, reps: '12', targets: { reps: 10 } },
          ],
        })}
        onChangeValue={jest.fn()}
      />,
    );

    expect(screen.getByText(/logMetrics\.entry\.setsCount:\{"count":2\}/)).toBeTruthy();
    expect(screen.queryByText(/setsProgress/)).toBeNull();
    expect(JSON.stringify(screen.toJSON())).not.toContain(`"backgroundColor":"${colors.success}"`);
  });
});
