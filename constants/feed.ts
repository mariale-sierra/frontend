import { spacing } from './theme';

/**
 * The air between two posts in every scroll of posts — Home's feed, a
 * profile's posts (the viewer you also reach from Search), and Home's loading
 * skeleton — so they always match. Raised from `2xl` (48) on explicit request
 * (2026-10-08: "more of a gap between posts… they have to match").
 */
export const FEED_POST_GAP_TOKEN = '3xl' as const;
export const FEED_POST_GAP = spacing[FEED_POST_GAP_TOKEN];
