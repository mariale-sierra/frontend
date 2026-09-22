import { pickAuthor, toChallengeMineViewModels, toExploreChallengeViewModels } from '../challengeListAdapter';
import type { ChallengeAuthorContract, ChallengeContract, ChallengePhoto } from '../../../types/challenge';

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

  it("carries the challenge's author through to the card", () => {
    const author: ChallengeAuthorContract = {
      id: 'u1',
      username: 'ana',
      displayName: 'Ana Ruiz',
      profileImageUrl: 'https://cdn/ana.jpg',
    };
    const [viewModel] = toExploreChallengeViewModels([buildChallenge({ id: 'A', author })]);

    // No `id` on the card's view model — see ChallengeAuthorViewModel's own doc comment.
    expect(viewModel.author).toEqual({
      username: 'ana',
      displayName: 'Ana Ruiz',
      profileImageUrl: 'https://cdn/ana.jpg',
    });
  });

  it('has no author for a challenge whose creator account is gone (backend sends `author: null`)', () => {
    const [viewModel] = toExploreChallengeViewModels([buildChallenge({ id: 'A', author: null })]);

    expect(viewModel.author).toBeNull();
  });

  it('has no author for an older cached response with no `author` field at all', () => {
    const [viewModel] = toExploreChallengeViewModels([buildChallenge({ id: 'A' })]);

    expect(viewModel.author).toBeNull();
  });
});

describe('pickAuthor', () => {
  it('drops a malformed author with no usable username rather than crashing the card', () => {
    expect(pickAuthor(buildChallenge({ id: 'A', author: { username: '' } as ChallengeAuthorContract }))).toBeNull();
    expect(pickAuthor(buildChallenge({ id: 'A', author: 'ana' as unknown as ChallengeAuthorContract }))).toBeNull();
  });

  it('falls back displayName/profileImageUrl to null rather than undefined, for a plain equality check', () => {
    const author = pickAuthor(
      buildChallenge({ id: 'A', author: { id: 'u1', username: 'ana' } as ChallengeAuthorContract }),
    );

    expect(author).toEqual({ username: 'ana', displayName: null, profileImageUrl: null });
  });
});

// A finished challenge must not vanish from Mine when its celebration is closed: it stays,
// as its "Finished" card, after the challenges still going.
describe('a finished challenge in Challenges-Mine', () => {
  const mine = () =>
    toChallengeMineViewModels(
      [
        buildChallenge({ id: 'LEFT', status: 'left', current_day: 3 }),
        buildChallenge({ id: 'FINISHED', status: 'completed', current_day: 30 }),
        buildChallenge({ id: 'GOING', status: 'active', current_day: 5 }),
      ],
      NO_PHOTOS,
    );

  it('stays in the list, as a `won` card', () => {
    const finished = mine().find((challenge) => challenge.challengeId === 'FINISHED');

    expect(finished).toBeDefined();
    expect(finished?.state).toBe('won');
  });

  it('comes after the challenges still going and before the ones that were left', () => {
    expect(mine().map((challenge) => challenge.challengeId)).toEqual(['GOING', 'FINISHED', 'LEFT']);
  });

  it('is the only card there when it is the only challenge', () => {
    const viewModels = toChallengeMineViewModels([buildChallenge({ id: 'A', status: 'completed' })], NO_PHOTOS);

    expect(viewModels.map((challenge) => challenge.state)).toEqual(['won']);
  });

  it('keeps what the card shows: how far it got', () => {
    const [finished] = toChallengeMineViewModels(
      [buildChallenge({ id: 'A', status: 'completed', current_day: 30, duration_days: 30 })],
      NO_PHOTOS,
    );

    expect(finished.currentDay).toBe(30);
    expect(finished.totalDays).toBe(30);
  });
});
