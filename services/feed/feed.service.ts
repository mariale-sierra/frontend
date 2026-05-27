import api from '../api';
import type { FeedPostContract } from '../../types/feed';

export async function getHomeFeed(): Promise<FeedPostContract[]> {
  const { data } = await api.get<FeedPostContract[]>('/feed');
  return data;
}
