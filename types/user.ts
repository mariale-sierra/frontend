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
}

/** What the backend exposes about OTHER users (never includes email). */
export interface PublicProfileContract {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  profile_image_url: string | null;
  is_private: boolean;
}

export interface UpdateProfilePayload {
  display_name?: string;
  bio?: string;
  preferred_language?: string;
  is_private?: boolean;
}
