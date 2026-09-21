import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { ChallengePhotoMosaicSkeleton } from '../ChallengePhotoMosaicSkeleton';
import type { ChallengePhoto } from '../../../../types/challenge';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const photo = (id: string, day: number): ChallengePhoto => ({
  id,
  challengeId: 'c1',
  day,
  userName: 'me',
  imageUrl: `https://example.com/${id}.jpg`,
  visibility: 'private',
  metrics: [],
  description: '',
});

describe('the consistency photo grid', () => {
  it('says there are no photos yet, in place of an empty space', async () => {
    const screen = await renderWithTheme(
      <ChallengePhotoMosaicSkeleton width={390} photos={[]} totalDays={30} onPressPhoto={jest.fn()} />,
    );

    expect(screen.getByText('challengeProgress.consistency.gridEmpty')).toBeTruthy();
  });

  it('does not say it when there are photos, and shows them', async () => {
    const screen = await renderWithTheme(
      <ChallengePhotoMosaicSkeleton
        width={390}
        photos={[photo('a', 1), photo('b', 2)]}
        totalDays={30}
        onPressPhoto={jest.fn()}
      />,
    );

    expect(screen.queryByText('challengeProgress.consistency.gridEmpty')).toBeNull();
    expect(JSON.stringify(screen.toJSON())).toContain('https://example.com/a.jpg');
  });

  it('counts only the photos within the challenge’s days — none, if the length is 0', async () => {
    const screen = await renderWithTheme(
      <ChallengePhotoMosaicSkeleton width={390} photos={[photo('a', 1)]} totalDays={0} onPressPhoto={jest.fn()} />,
    );

    expect(screen.getByText('challengeProgress.consistency.gridEmpty')).toBeTruthy();
  });
});
