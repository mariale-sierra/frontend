import {
  deriveChallengeCardState,
  getChallengeGlowColor,
  getChallengeGlowKey,
  groupLatestPhotoByChallengeId,
  isChallengeFinished,
  normalizeChallengeStatus,
  pickChallengeStatus,
} from '../challengeState';
import { activityColors, colors } from '../../../constants/theme';
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

describe('normalizeChallengeStatus', () => {
  it('reads the raw value directly, not off a challenge object', () => {
    expect(normalizeChallengeStatus('completed')).toBe('completed');
    expect(normalizeChallengeStatus('left')).toBe('left');
    expect(normalizeChallengeStatus('active')).toBe('active');
  });

  it('recognizes common synonyms for left/abandoned', () => {
    expect(normalizeChallengeStatus('quit')).toBe('left');
    expect(normalizeChallengeStatus('abandoned')).toBe('left');
    expect(normalizeChallengeStatus('dropped')).toBe('left');
  });

  it('defaults to active for anything missing or unrecognized', () => {
    expect(normalizeChallengeStatus(undefined)).toBe('active');
    expect(normalizeChallengeStatus(null)).toBe('active');
    // The challenge's own unrelated 'open'/'closed' admin field must NOT be
    // misread as a relation status — this is the exact regression
    // (a finished/left challenge's progress screen stuck on "active")
    // pickChallengeStatus's old direct-object-read on GET /challenges/:id
    // caused, before useChallengeActiveProgress.ts switched to reading
    // `progress.relationStatus` through this function instead.
    expect(normalizeChallengeStatus('open')).toBe('active');
    expect(normalizeChallengeStatus('closed')).toBe('active');
  });

  it('pickChallengeStatus delegates to it for the merged-object shape', () => {
    expect(pickChallengeStatus({ id: '1', name: 'x', status: 'completed' } as any)).toBe(
      normalizeChallengeStatus('completed'),
    );
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

describe('getChallengeGlowColor', () => {
  it('is lavender on a rest day, whatever the activity', () => {
    expect(getChallengeGlowColor('rest', 'strength')).toBe(colors.rest);
    expect(getChallengeGlowColor('rest', null)).toBe(colors.rest);
  });

  it('is green once today is completed, whatever the activity', () => {
    expect(getChallengeGlowColor('completed', 'mindBody')).toBe(colors.success);
    expect(getChallengeGlowColor('completed', null)).toBe(colors.success);
  });

  it('is the activity color on a train day', () => {
    expect(getChallengeGlowColor('active', 'cardioLow')).toBe(activityColors.cardioLow);
  });

  it('stays the activity color for a finished or left challenge', () => {
    expect(getChallengeGlowColor('won', 'flexibility')).toBe(activityColors.flexibility);
    expect(getChallengeGlowColor('left', 'flexibility')).toBe(activityColors.flexibility);
  });

  it('falls back to the neutral primary when there is no dominant category yet', () => {
    expect(getChallengeGlowColor('active', null)).toBe(colors.primary);
  });
});

describe('getChallengeGlowKey', () => {
  it('is the state itself on a rest day and once today is completed, whatever the activity', () => {
    expect(getChallengeGlowKey('rest', 'strength')).toBe('rest');
    expect(getChallengeGlowKey('rest', null)).toBe('rest');
    expect(getChallengeGlowKey('completed', 'mindBody')).toBe('completed');
  });

  it('is the activity on a train day, and for a finished or left challenge', () => {
    expect(getChallengeGlowKey('active', 'cardioLow')).toBe('cardioLow');
    expect(getChallengeGlowKey('won', 'flexibility')).toBe('flexibility');
    expect(getChallengeGlowKey('left', 'functional')).toBe('functional');
  });

  it('is the fallback when there is no dominant activity yet', () => {
    expect(getChallengeGlowKey('active', null)).toBe('default');
    expect(getChallengeGlowKey('won', undefined)).toBe('default');
  });

  it('agrees with the glow color for every state and activity', () => {
    for (const state of ['active', 'rest', 'completed', 'won', 'left'] as const) {
      for (const category of [null, 'strength', 'cardioIntense', 'cardioLow', 'flexibility', 'mindBody', 'functional'] as const) {
        const key = getChallengeGlowKey(state, category);
        const expected =
          key === 'rest' ? colors.rest : key === 'completed' ? colors.success : key === 'default' ? colors.primary : activityColors[key];
        expect(getChallengeGlowColor(state, category)).toBe(expected);
      }
    }
  });
});

describe('isChallengeFinished', () => {
  it('is finished once the LAST day is logged', () => {
    expect(isChallengeFinished({ currentDay: 75, totalDays: 75, completedToday: true })).toBe(true);
  });

  it('is not finished on the last day until that day is logged', () => {
    expect(isChallengeFinished({ currentDay: 75, totalDays: 75, completedToday: false })).toBe(false);
    expect(isChallengeFinished({ currentDay: 75, totalDays: 75 })).toBe(false);
  });

  it('is not finished on any earlier day, however done today is', () => {
    expect(isChallengeFinished({ currentDay: 74, totalDays: 75, completedToday: true })).toBe(false);
    expect(isChallengeFinished({ currentDay: 1, totalDays: 75, completedToday: true })).toBe(false);
  });

  it('counts a day past the end (an uncapped server) the same as the last one', () => {
    expect(isChallengeFinished({ currentDay: 80, totalDays: 75, completedToday: true })).toBe(true);
  });

  it('is never finished with no days at all, or no current day', () => {
    expect(isChallengeFinished({ currentDay: 0, totalDays: 0, completedToday: true })).toBe(false);
    expect(isChallengeFinished({ totalDays: 75, completedToday: true })).toBe(false);
  });
});
