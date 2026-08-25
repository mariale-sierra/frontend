import { getHomeChallengesSorted } from '../homeAdapter';
import type { ChallengeContract, ChallengePhoto } from '../../../types/challenge';

function buildChallenge(overrides: Partial<ChallengeContract> & { id: string }): ChallengeContract {
  return {
    name: `Challenge ${overrides.id}`,
    duration_days: 30,
    status: 'active',
    ...overrides,
  } as ChallengeContract;
}

function buildPhoto(overrides: Partial<ChallengePhoto> & { challengeId: string; day: number }): ChallengePhoto {
  return {
    id: `photo-${overrides.challengeId}-${overrides.day}`,
    userName: 'me',
    imageUrl: 'https://example.com/photo.jpg',
    visibility: 'private',
    metrics: [],
    description: '',
    ...overrides,
  };
}

const NO_PHOTOS = new Map<string, ChallengePhoto>();

describe('getHomeChallengesSorted', () => {
  it('sorts active challenges by days remaining (soonest to finish first)', () => {
    // A: 30 - 25 = 5 days remaining. B: 30 - 10 = 20 days remaining.
    const challengeA = buildChallenge({ id: 'A', current_day: 25, duration_days: 30, status: 'active' });
    const challengeB = buildChallenge({ id: 'B', current_day: 10, duration_days: 30, status: 'active' });
    const challengeC = buildChallenge({ id: 'C', current_day: 30, duration_days: 30, status: 'completed' });

    // Passed in an arbitrary order — the adapter must do the sorting.
    const result = getHomeChallengesSorted([challengeB, challengeC, challengeA], NO_PHOTOS);

    // C's whole-challenge status is 'completed' → state 'won' → excluded
    // from Home entirely (belongs on the Challenges tab instead).
    expect(result.map((vm) => vm.challengeId)).toEqual(['A', 'B']);
  });

  it('excludes a fully finished ("won") challenge from Home — it belongs on the Challenges tab', () => {
    const activeChallenge = buildChallenge({ id: 'A', current_day: 25, duration_days: 30, status: 'active' });
    const wonChallenge = buildChallenge({ id: 'C', current_day: 30, duration_days: 30, status: 'completed' });

    const result = getHomeChallengesSorted([wonChallenge, activeChallenge], NO_PHOTOS);

    expect(result.map((vm) => vm.challengeId)).toEqual(['A']);
  });

  it('excludes a left/abandoned challenge from Home too', () => {
    const leftChallenge = buildChallenge({ id: 'D', status: 'left', current_day: 5, duration_days: 30 });

    const result = getHomeChallengesSorted([leftChallenge], NO_PHOTOS);

    expect(result).toHaveLength(0);
  });

  it('builds a view model with the correct data for an in-progress challenge with no photo yet today', () => {
    const challenge = buildChallenge({
      id: 'A',
      name: 'Iron Will',
      current_day: 14,
      duration_days: 75,
      status: 'active',
    });

    const [viewModel] = getHomeChallengesSorted([challenge], NO_PHOTOS);

    expect(viewModel).toMatchObject({
      challengeId: 'A',
      title: 'Iron Will',
      currentDay: 14,
      totalDays: 75,
      state: 'active',
    });
  });

  // This is the exact bug that shipped: a card stayed on "active" (Train
  // Day) after the user uploaded today's photo. Root cause was fetching
  // the wrong (challenge-wide, not user-scoped) photo endpoint — this test
  // guards the correct behavior once given the right, user-scoped input.
  it('shows `completed` once the user has a photo for TODAY specifically', () => {
    const challenge = buildChallenge({ id: 'A', current_day: 14, duration_days: 75, status: 'active' });
    const photos = new Map([['A', buildPhoto({ challengeId: 'A', day: 14 })]]);

    const [viewModel] = getHomeChallengesSorted([challenge], photos);

    expect(viewModel.state).toBe('completed');
  });

  it('does NOT show `completed` from an older photo on a day that has not been logged yet', () => {
    const challenge = buildChallenge({ id: 'A', current_day: 14, duration_days: 75, status: 'active' });
    // Photo from day 10 — an older post, not today's.
    const photos = new Map([['A', buildPhoto({ challengeId: 'A', day: 10 })]]);

    const [viewModel] = getHomeChallengesSorted([challenge], photos);

    expect(viewModel.state).toBe('active');
  });

  it('shows `rest` on a rest day with no photo logged', () => {
    const challenge = buildChallenge({
      id: 'A',
      current_day: 14,
      duration_days: 75,
      status: 'active',
      today_is_rest_day: true,
    });

    const [viewModel] = getHomeChallengesSorted([challenge], NO_PHOTOS);

    expect(viewModel.state).toBe('rest');
  });

  // Real shipped bug: GET /users/me/challenges (the actual data source for
  // this screen) never sets `today_is_rest_day` — only `GET /challenges/:id`
  // returns `cycle_days`, which app/(tabs)/index.tsx now merges in via
  // enrichChallenges.ts before calling this function. Without that merge (or
  // without this fallback), every rest day silently rendered as "active."
  it('derives `rest` from `cycle_days` when no direct rest-day flag is present', () => {
    const challenge = buildChallenge({
      id: 'A',
      current_day: 4, // 4-day cycle, day 4 = position 4 = the rest day below
      duration_days: 30,
      status: 'active',
      cycle_length_days: 4,
      cycle_days: [
        { day_number: 1, is_rest_day: false },
        { day_number: 2, is_rest_day: false },
        { day_number: 3, is_rest_day: false },
        { day_number: 4, is_rest_day: true },
      ],
    });

    const [viewModel] = getHomeChallengesSorted([challenge], NO_PHOTOS);

    expect(viewModel.state).toBe('rest');
  });

  it("today's photo takes priority over the rest-day flag", () => {
    const challenge = buildChallenge({
      id: 'A',
      current_day: 14,
      duration_days: 75,
      status: 'active',
      today_is_rest_day: true,
    });
    const photos = new Map([['A', buildPhoto({ challengeId: 'A', day: 14 })]]);

    const [viewModel] = getHomeChallengesSorted([challenge], photos);

    expect(viewModel.state).toBe('completed');
  });

  it('places a completed-today challenge after still-actionable ones', () => {
    const activeChallenge = buildChallenge({ id: 'A', current_day: 25, duration_days: 30, status: 'active' });
    const doneToday = buildChallenge({ id: 'B', current_day: 5, duration_days: 30, status: 'active' });
    const photos = new Map([['B', buildPhoto({ challengeId: 'B', day: 5 })]]);

    const result = getHomeChallengesSorted([doneToday, activeChallenge], photos);

    expect(result.map((vm) => vm.challengeId)).toEqual(['A', 'B']);
  });
});
