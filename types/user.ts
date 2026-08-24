export interface UserProfileContract {
  id: string;
  username?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/** Full editable profile, only for the session user (GET/PATCH /users/me/profile). */
export interface MyProfileContract {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio: string | null;
  preferred_language: string;
  profile_image_url: string | null;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  /**
   * Overall daily-activity streak (not per-challenge — see
   * BadgesService.currentStreakDays on the backend). No endpoint sends this
   * yet, so it's optional; ProfileHeader hides the streak badge/stat
   * entirely when absent rather than showing a fabricated 0.
   */
  streak_days?: number;
}

/** What the backend exposes about OTHER users (never includes email). */
export interface PublicProfileContract {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  profile_image_url: string | null;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  /** Whether the authenticated caller actively follows this user. */
  is_following: boolean;
  /** See MyProfileContract.streak_days — same "not sent yet" caveat. */
  streak_days?: number;
}

export interface UpdateProfilePayload {
  display_name?: string;
  bio?: string;
  preferred_language?: string;
  is_private?: boolean;
}
