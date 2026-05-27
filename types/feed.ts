export interface FeedPostContract {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  challenge_id: string;
  challenge_name: string;
  activity_type?: string;
  challenge_day: number;
  image_url?: string;
  caption?: string;
  posted_at: string; // ISO 8601
  likes_count?: number;
}
