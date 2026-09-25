import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { SpaceCard } from '../SpaceCard';
import { activityColors } from '../../../constants/theme';
import { boostSaturation } from '../../../utils/color';
import type { SpaceContract } from '../../../types/space';

// The glow is drawn once the card has been measured; this hands it a size at once.
jest.mock('../../ui/accentGlow', () => ({
  AccentGlow: ({ children }: { children: (size: { width: number; height: number }) => React.ReactNode }) =>
    children({ width: 342, height: 140 }),
}));
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
  activityCategory: { id: 2, code: 'cardio-low', name: 'Cardio Low' },
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

  it('renders the member count, and no category badge', async () => {
    const screen = await renderWithTheme(
      <SpaceCard space={buildSpace()} onPress={jest.fn()} onPressCta={jest.fn()} />,
    );

    expect(screen.queryByText('Cardio Low')).toBeNull();
    // Real bug this test previously couldn't catch: `react-i18next` is
    // mocked here (no real pluralization), so this assertion used to encode
    // the ACTUAL production bug (passing `formatCount()`'s string output as
    // `count`, which breaks i18next's real `_one`/`_other` resolution and
    // prints the raw key on screen) as if it were correct. `count` (a real
    // number, for plural resolution) and `formattedCount` (the display
    // string) are now passed separately — both show up in this mock's
    // `key:val1,val2` output.
    expect(screen.getByText('spaces.membersCount:50,50')).toBeTruthy();
  });

  // The plain diagonal `linearGlow` gradient (`AccentCard`'s), matching a
  // reference image — real change 2026-09-25 (see SpaceCardView.tsx's own
  // doc comment for the fuller history; SpaceCardView.test.tsx has the
  // fuller "its glow" coverage — this is just SpaceCard's own smoke test
  // that the color reaches the glow at all).
  it("lights the card with its glow in the space's own category color", async () => {
    const screen = await renderWithTheme(
      <SpaceCard
        space={buildSpace({ activityCategory: { id: 5, code: 'mind-body', name: 'Mind-Body' } })}
        onPress={jest.fn()}
        onPressCta={jest.fn()}
      />,
    );
    // `AccentCard`'s `linearGlow` end color — `boostSaturation(color,
    // ACCENT_VIVID_FACTOR)` (see accentCard.tsx).
    const DOME_VIVID_FACTOR = 1.25;

    expect(JSON.stringify(screen.toJSON())).toContain(boostSaturation(activityColors.mindBody, DOME_VIVID_FACTOR));
  });
});
