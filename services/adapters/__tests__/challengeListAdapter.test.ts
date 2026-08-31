import { toChallengeMineViewModels, toExploreChallengeViewModels } from '../challengeListAdapter';
import type { ChallengeContract, ChallengePhoto } from '../../../types/challenge';

function buildChallenge(overrides: Partial<ChallengeContract> & { id: string }): ChallengeContract {
  return {
    name: `Challenge ${overrides.id}`,
    duration_days: 30,
    status: 'active',
    ...overrides,
  } as ChallengeContract;
}

const NO_PHOTOS = new Map<string, ChallengePhoto>();

describe('toChallengeMineViewModels', () => {
  // Real shipped bug: GET /users/me/challenges (the Mine tab's actual data
  // source) never includes a direct rest-day flag — only `cycle_days` from
  // GET /challenges/:id, which app/(tabs)/challenges.tsx now merges in via
  // enrichChallenges.ts. Without it, every rest day rendered as "Train day."
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

    const [viewModel] = toChallengeMineViewModels([challenge], NO_PHOTOS);

    expect(viewModel.state).toBe('rest');
  });

  it('falls back to `active` when `cycle_days` is absent entirely (no crash, no false rest day)', () => {
    const challenge = buildChallenge({ id: 'A', current_day: 4, duration_days: 30, status: 'active' });

    const [viewModel] = toChallengeMineViewModels([challenge], NO_PHOTOS);

    expect(viewModel.state).toBe('active');
  });

  it('still respects an explicit direct rest-day flag when present, cycle_days or not', () => {
    const challenge = buildChallenge({
      id: 'A',
      current_day: 4,
      duration_days: 30,
      status: 'active',
      today_is_rest_day: true,
    });

    const [viewModel] = toChallengeMineViewModels([challenge], NO_PHOTOS);

    expect(viewModel.state).toBe('rest');
  });
});

describe('toExploreChallengeViewModels', () => {
  it('sorts most-joined first', () => {
    const challenges = [
      buildChallenge({ id: 'few', members_count: 3 }),
      buildChallenge({ id: 'most', members_count: 248 }),
      buildChallenge({ id: 'none' }), // no members_count field at all
      buildChallenge({ id: 'some', members_count: 40 }),
    ];

    const viewModels = toExploreChallengeViewModels(challenges);

    expect(viewModels.map((v) => v.challengeId)).toEqual(['most', 'some', 'few', 'none']);
  });
});
