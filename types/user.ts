export interface UserProfileContract {
  id: string;
  username?: string;
  email?: string;
  is_active?: boolean;
  /** Bloque 1 — global platform admin (GET /users/me only). */
  is_admin?: boolean;
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
   * Overall daily-activity streak (not per-challenge — consecutive UTC days
   * with a COMPLETED workout log ending today; see `getCurrentStreakDays` /
   * `UsersService.attachProgress` on the backend). Sent by GET /users/me and
   * PATCH /users/me/profile (and the photo-upload response) since 2026-09-22.
   * Still optional here for an older cached response; ProfileHeader hides the
   * streak badge/stat entirely when absent rather than showing a fabricated 0.
   */
  streak_days?: number;
  /** Self-reported sport/fitness practices (onboarding's "what do you do"
   * step) — shown as colored badges on the profile screen, resolved via
   * `constants/practiceOptions.ts`. Never privacy-gated — always sent, an
   * identity tag like display_name/photo, not activity data like
   * streak_days. Defaults to `[]` server-side, but still optional here for
   * an older cached response predating this field. */
  practice_preferences?: string[];
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
  /** See MyProfileContract.streak_days. Sent by GET /users/:id/profile and
   * GET /users/search since 2026-09-22, but only when `canSeeFullProfile` is
   * true (public account, or the caller follows a private one) — a stranger
   * viewing a private profile gets no `streak_days` at all, same as every
   * other profile stat. */
  streak_days?: number;
  /** See MyProfileContract.practice_preferences — never privacy-gated,
   * shown even on a private profile a stranger can't otherwise see into. */
  practice_preferences?: string[];
}

export interface UpdateProfilePayload {
  display_name?: string;
  bio?: string;
  preferred_language?: string;
  is_private?: boolean;
  /** Capped at `MAX_PRACTICE_PREFERENCES` (constants/practiceOptions.ts) —
   * the backend enforces the same cap independently, this is just the
   * client staying in sync with it. */
  practice_preferences?: string[];
}
