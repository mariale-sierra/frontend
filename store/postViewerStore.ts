import { create } from 'zustand';
import type { FeedPostViewModel } from '../services/adapters/feedAdapter';

interface PostViewerStore {
  /** The posts the viewer scrolls through, newest first (a profile's grid). */
  posts: FeedPostViewModel[];
  /** The one that was tapped — the viewer opens on it. */
  startId: string | null;
  open: (posts: FeedPostViewModel[], startId: string) => void;
  /** A post deleted from inside the viewer (your own, via its "..." menu). */
  remove: (postId: string) => void;
}

/**
 * Hands a profile's posts to the post viewer screen (`app/profile/posts.tsx`)
 * — a whole list of view models is no route param. Set right before pushing
 * the screen (see `openPostViewer`).
 */
export const usePostViewerStore = create<PostViewerStore>((set) => ({
  posts: [],
  startId: null,
  open: (posts, startId) => set({ posts, startId }),
  remove: (postId) => set((state) => ({ posts: state.posts.filter((post) => post.id !== postId) })),
}));
