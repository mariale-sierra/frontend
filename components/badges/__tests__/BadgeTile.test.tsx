import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { BadgeTile } from '../BadgeTile';
import type { BadgeContract } from '../../../types/badge';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

const badge = (over: Partial<BadgeContract>): BadgeContract => ({
  code: 'ten_workouts',
  name: '10 workouts',
  description: '',
  earned: true,
  progress: 10,
  target: 10,
  ...over,
});

describe('BadgeTile', () => {
  it('draws an earned badge in its tier metal', async () => {
    const screen = await renderWithTheme(<BadgeTile badge={badge({})} onPress={jest.fn()} />);

    expect(screen.getByTestId('metallic-disc-gold')).toBeTruthy();
  });

  it('draws a locked badge dim, ringed by its progress in the metal it leads to', async () => {
    const screen = await renderWithTheme(
      <BadgeTile badge={badge({ earned: false, progress: 3 })} onPress={jest.fn()} />,
    );

    expect(screen.queryByTestId(/^metallic-disc-/)).toBeNull();
    expect(screen.getByTestId('locked-disc-gold')).toBeTruthy();
    expect(screen.getByTestId('locked-disc-progress')).toBeTruthy();
  });

  it('has no progress arc on a locked badge with nothing done yet', async () => {
    const screen = await renderWithTheme(
      <BadgeTile badge={badge({ earned: false, progress: 0 })} onPress={jest.fn()} />,
    );

    expect(screen.queryByTestId('locked-disc-progress')).toBeNull();
  });
});
