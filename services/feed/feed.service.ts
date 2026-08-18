import api from '../api';
import type { FeedPostContract } from '../../types/feed';

export interface FeedPage {
  posts: FeedPostContract[];
  /** Opaque cursor for the next page, absent on the last page. */
  nextCursor?: string;
}

/** GET /feed — cursor-paginated. Omit `cursor` for the first page. */
export async function getHomeFeed(cursor?: string): Promise<FeedPage> {
  const { data, headers } = await api.get<FeedPostContract[]>('/feed', {
    params: cursor ? { cursor } : undefined,
  });
  return {
    posts: Array.isArray(data) ? data : [],
    nextCursor: headers['x-next-cursor'] as string | undefined,
  };
}
