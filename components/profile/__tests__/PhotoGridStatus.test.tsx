import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { PhotoGridList } from '../PhotoGrid';
import type { ChallengePhoto } from '../../../types/challenge';

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));

const photo = (id: string, moderationStatus?: ChallengePhoto['moderationStatus']): ChallengePhoto => ({
  id,
  challengeId: 'c1',
  userName: 'me',
  imageUrl: `https://cdn.example.com/${id}.jpg`,
  day: 1,
  visibility: 'public',
  metrics: [],
  description: '',
  moderationStatus,
});

// Sprint 10, B2: your own photos say when they are still in review or were not
// published, instead of looking like every other photo.
describe('PhotoGridList — review state of your own photos', () => {
  it('labels a pending photo "in review" and a rejected one "not published"', async () => {
    const screen = await renderWithTheme(
      <PhotoGridList photos={[photo('a', 'pending'), photo('b', 'rejected')]} loading={false} emptyLabel="" />,
    );

    expect(screen.getByTestId('photo-status-pending')).toBeTruthy();
    expect(screen.getByText('profile.photoStatus.pending')).toBeTruthy();
    expect(screen.getByTestId('photo-status-rejected')).toBeTruthy();
    expect(screen.getByText('profile.photoStatus.rejected')).toBeTruthy();
  });

  it('adds no label to an approved photo, or to one without a state (someone else\'s, older API)', async () => {
    const screen = await renderWithTheme(
      <PhotoGridList photos={[photo('a', 'approved'), photo('b')]} loading={false} emptyLabel="" />,
    );

    expect(screen.queryByTestId('photo-status-pending')).toBeNull();
    expect(screen.queryByTestId('photo-status-rejected')).toBeNull();
  });
});
