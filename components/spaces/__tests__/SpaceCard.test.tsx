import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { SpaceCard } from '../SpaceCard';
import type { SpaceContract } from '../../../types/space';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${Object.values(params).join(',')}` : key,
  }),
}));

const buildSpace = (overrides: Partial<SpaceContract> = {}): SpaceContract => ({
  id: 'space-1',
  name: 'Girls running club',
  description: 'Sunrise 5Ks and slow jogs, every weekend rain or not.',
  imageUrl: null,
  visibility: 'public',
  activityCategory: { id: 2, code: 'cardio_low', name: 'Cardio Low' },
  createdBy: { id: 'owner-1', username: 'owner', displayName: null, profileImageUrl: null },
  membersCount: 50,
  isMember: false,
  role: null,
  hasPendingRequest: false,
  createdAt: '2026-08-01T00:00:00Z',
  ...overrides,
});

describe('SpaceCard', () => {
  it('shows a Join pill for a public space the viewer has not joined', async () => {
    const onPressCta = jest.fn();
    const screen = await renderWithTheme(
      <SpaceCard space={buildSpace()} onPress={jest.fn()} onPressCta={onPressCta} />,
    );

    const cta = screen.getByText('spaces.joinCta');
    fireEvent.press(cta);
    expect(onPressCta).toHaveBeenCalledTimes(1);
  });

  it('shows a Request to join pill for a private space the viewer has not requested', async () => {
    const screen = await renderWithTheme(
      <SpaceCard space={buildSpace({ visibility: 'private' })} onPress={jest.fn()} onPressCta={jest.fn()} />,
    );

    expect(screen.getByText('spaces.requestCta')).toBeTruthy();
    expect(screen.queryByText('spaces.joinCta')).toBeNull();
  });

  it('shows a disabled Pending pill instead of a CTA when a request is already pending', async () => {
    const onPressCta = jest.fn();
    const screen = await renderWithTheme(
      <SpaceCard
        space={buildSpace({ visibility: 'private', hasPendingRequest: true })}
        onPress={jest.fn()}
        onPressCta={onPressCta}
      />,
    );

    expect(screen.getByText('spaces.pendingCta')).toBeTruthy();
    expect(screen.queryByText('spaces.requestCta')).toBeNull();
  });

  it('shows neither pill once the viewer is already a member or the owner', async () => {
    const screen = await renderWithTheme(
      <SpaceCard
        space={buildSpace({ isMember: true, role: 'member' })}
        onPress={jest.fn()}
        onPressCta={jest.fn()}
      />,
    );

    expect(screen.queryByText('spaces.joinCta')).toBeNull();
    expect(screen.queryByText('spaces.requestCta')).toBeNull();
    expect(screen.queryByText('spaces.pendingCta')).toBeNull();
  });

  it('calls onPress when the card body is tapped', async () => {
    const onPress = jest.fn();
    const screen = await renderWithTheme(
      <SpaceCard space={buildSpace()} onPress={onPress} onPressCta={jest.fn()} />,
    );

    fireEvent.press(screen.getByText('Girls running club'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the member count and category badge', async () => {
    const screen = await renderWithTheme(
      <SpaceCard space={buildSpace()} onPress={jest.fn()} onPressCta={jest.fn()} />,
    );

    expect(screen.getByText('Cardio Low')).toBeTruthy();
    expect(screen.getByText('spaces.membersCount:50')).toBeTruthy();
  });
});
