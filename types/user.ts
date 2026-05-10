export interface UserProfileContract {
  id: string;
  username?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}