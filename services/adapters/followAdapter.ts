import type { FriendStreakContract } from '../../types/follow';

export interface FriendStreakViewModel {
  userId: string;
  username: string;
  avatarUrl?: string;
  streakDays: number;
  /** Drives the streak badge color — see FriendStreakCard. */
  loggedToday: boolean;
}

export function toFriendStreakViewModel(row: FriendStreakContract): FriendStreakViewModel {
  return {
    userId: row.userId,
    username: row.username,
    avatarUrl: row.avatarUrl,
    streakDays: row.streakDays,
    loggedToday: row.loggedToday,
  };
}

export function toFriendStreakViewModels(rows: FriendStreakContract[]): FriendStreakViewModel[] {
  return rows.map(toFriendStreakViewModel);
}
