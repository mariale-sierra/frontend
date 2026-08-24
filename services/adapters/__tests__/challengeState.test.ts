import { deriveChallengeCardState, groupLatestPhotoByChallengeId, pickChallengeStatus } from '../challengeState';
import type { ChallengeContract, ChallengePhoto } from '../../../types/challenge';

describe('deriveChallengeCardState', () => {
  const base = { status: 'active' as const, isRestDay: false, currentDay: 10, latestPhotoDay: null };

  it('is `active` when nothing else applies — still needs a photo today', () => {
    expect(deriveChallengeCardState(base)).toBe('active');
  });

  it('is `completed` when the latest photo is for TODAY specifically', () => {
    expect(deriveChallengeCardState({ ...base, latestPhotoDay: 10 })).toBe('completed');
  });

  it('is NOT `completed` from an older photo — today still has none', () => {
    expect(deriveChallengeCardState({ ...base, latestPhotoDay: 9 })).toBe('active');
  });

  it('is `rest` on a rest day with no photo yet', () => {
    expect(deriveChallengeCardState({ ...base, isRestDay: true })).toBe('rest');
  });

  it("today's photo takes priority over the rest-day flag", () => {
    expect(deriveChallengeCardState({ ...base, isRestDay: true, latestPhotoDay: 10 })).toBe('completed');
  });

  it('is `won` when the whole challenge is finished, regardless of photo/rest-day', () => {
    expect(deriveChallengeCardState({ ...base, status: 'completed', isRestDay: true, latestPhotoDay: 10 })).toBe('won');
  });

  it('is `left` when the user abandoned the challenge, regardless of photo/rest-day', () => {
    expect(deriveChallengeCardState({ ...base, status: 'left', isRestDay: true, latestPhotoDay: 10 })).toBe('left');
  });

  it('prioritizes `won` over `left` if a caller somehow passes both signals (status wins, only one is possible in practice)', () => {
    // Not a reachable real case (status is a single value) — just documents
    // the priority order is status-first, unconditionally.
    expect(deriveChallengeCardState({ ...base, status: 'completed' })).toBe('won');
  });
});

describe('pickChallengeStatus', () => {
  function buildChallenge(overrides: Partial<ChallengeContract>): ChallengeContract {
    return { id: '1', name: 'Test', ...overrides } as ChallengeContract;
  }

  it('reads the explicit status field first', () => {
    expect(pickChallengeStatus(buildChallenge({ status: 'completed' }))).toBe('completed');
    expect(pickChallengeStatus(buildChallenge({ status: 'left' }))).toBe('left');
    expect(pickChallengeStatus(buildChallenge({ status: 'active' }))).toBe('active');
  });

  it('recognizes common synonyms for left/abandoned', () => {
    expect(pickChallengeStatus(buildChallenge({ status: 'quit' }))).toBe('left');
    expect(pickChallengeStatus(buildChallenge({ status: 'abandoned' }))).toBe('left');
    expect(pickChallengeStatus(buildChallenge({ status: 'dropped' }))).toBe('left');
  });

  it('defaults to active when status is missing entirely', () => {
    expect(pickChallengeStatus(buildChallenge({}))).toBe('active');
  });

  // Regression: this used to check progress percentage BEFORE the real
  // status field, so a challenge with every day-so-far logged (100%) but
  // still genuinely in progress (status: 'active') was misclassified as
  // finished. The real status is a stored, explicit field
  // (challenge_user_map.status) — it must always win.
  it('does not let a 100%-logged-so-far challenge override an explicit "active" status', () => {
    const challenge = buildChallenge({
      status: 'active',
      current_day: 10,
      duration_days: 10,
      progress_percent: 100,
    });
    expect(pickChallengeStatus(challenge)).toBe('active');
  });
});

describe('groupLatestPhotoByChallengeId', () => {
  function buildPhoto(overrides: Partial<ChallengePhoto> & { challengeId: string }): ChallengePhoto {
    return {
      id: `photo-${overrides.challengeId}-${overrides.day ?? 0}`,
      userName: 'me',
      imageUrl: 'https://example.com/photo.jpg',
      day: 1,
      visibility: 'private',
      metrics: [],
      description: '',
      ...overrides,
    };
  }

  it('keeps only the latest (first, since input is already most-recent-first) photo per challenge', () => {
    // GET /workout-posts/mine is already ordered most-recent-first — day 5
    // appearing before day 3 for the same challenge reflects that ordering.
    const photos = [
      buildPhoto({ challengeId: 'A', day: 5 }),
      buildPhoto({ challengeId: 'A', day: 3 }),
      buildPhoto({ challengeId: 'B', day: 2 }),
    ];

    const grouped = groupLatestPhotoByChallengeId(photos);

    expect(grouped.get('A')?.day).toBe(5);
    expect(grouped.get('B')?.day).toBe(2);
    expect(grouped.size).toBe(2);
  });

  it('returns an empty map for no photos', () => {
    expect(groupLatestPhotoByChallengeId([]).size).toBe(0);
  });
});
