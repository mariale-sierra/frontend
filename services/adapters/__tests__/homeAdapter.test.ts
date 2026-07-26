import { getHomeChallengesSorted } from '../homeAdapter';
import type { ChallengeContract } from '../../../types/challenge';

function buildChallenge(overrides: Partial<ChallengeContract> & { id: string }): ChallengeContract {
  return {
    name: `Challenge ${overrides.id}`,
    duration_days: 30,
    status: 'active',
    ...overrides,
  } as ChallengeContract;
}

describe('getHomeChallengesSorted', () => {
  it('sorts active challenges by days remaining (soonest to finish first)', () => {
    // A: 30 - 25 = 5 days remaining. B: 30 - 10 = 20 days remaining.
    const challengeA = buildChallenge({ id: 'A', current_day: 25, duration_days: 30, status: 'active' });
    const challengeB = buildChallenge({ id: 'B', current_day: 10, duration_days: 30, status: 'active' });
    const challengeC = buildChallenge({
      id: 'C',
      current_day: 30,
      duration_days: 30,
      status: 'completed',
      is_completed: true,
    });

    // Passed in an arbitrary order — the adapter must do the sorting.
    const result = getHomeChallengesSorted([challengeB, challengeC, challengeA]);

    expect(result.map((vm) => vm.challengeId)).toEqual(['A', 'B', 'C']);
  });

  it('places completed challenges after all active ones, regardless of input order', () => {
    const activeChallenge = buildChallenge({ id: 'A', current_day: 25, duration_days: 30, status: 'active' });
    const completedChallenge = buildChallenge({
      id: 'C',
      current_day: 30,
      duration_days: 30,
      status: 'completed',
      is_completed: true,
    });

    const result = getHomeChallengesSorted([completedChallenge, activeChallenge]);

    expect(result.map((vm) => vm.challengeId)).toEqual(['A', 'C']);
    expect(result.find((vm) => vm.challengeId === 'A')!.isCompleted).toBe(false);
    expect(result.find((vm) => vm.challengeId === 'C')!.isCompleted).toBe(true);
  });

  it('builds a view model with the correct data for each challenge', () => {
    const challenge = buildChallenge({
      id: 'A',
      name: 'Iron Will',
      current_day: 14,
      duration_days: 75,
      status: 'active',
      today_completed: true,
      categories: ['Strength'],
    });

    const [viewModel] = getHomeChallengesSorted([challenge]);

    expect(viewModel).toEqual({
      challengeId: 'A',
      title: 'Iron Will',
      currentDay: 14,
      totalDays: 75,
      isTodayCompleted: true,
      isCompleted: false,
      activityType: 'strength',
      isRestDay: false,
    });
  });

  it('excludes challenges the user left (regression: previously fell through to "active")', () => {
    const leftChallenge = buildChallenge({ id: 'D', status: 'left', current_day: 5, duration_days: 30 });

    const result = getHomeChallengesSorted([leftChallenge]);

    expect(result).toHaveLength(0);
  });
});
