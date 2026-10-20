import { spacing } from './theme';

/**
 * The air between two posts in every scroll of posts — Home's feed, a
 * profile's posts (the viewer you also reach from Search), and Home's loading
 * skeleton — so they always match. Raised from `2xl` (48) on explicit request
 * (2026-10-08: "more of a gap between posts… they have to match").
 */
export const FEED_POST_GAP_TOKEN = '3xl' as const;
export const FEED_POST_GAP = spacing[FEED_POST_GAP_TOKEN];

/**
 * Home's side margin for text, profiles and buttons — one token tighter than
 * the app-wide `lg` screen margin (explicit request, 2026-10-15: "a more
 * compact layout, not glued to the edges"). Photos and the horizontal
 * carousels don't use it as an outer margin: they run edge to edge and only
 * start/end their content at this inset.
 */
export const HOME_EDGE_INSET = spacing.base;

/**
 * Side inset of a feed post's author row, action buttons, metrics and caption
 * on Home — one token tighter than HOME_EDGE_INSET (explicit request,
 * 2026-10-15: "a bit closer to the sides"), so the post's own controls sit
 * closer to the edge-to-edge photo they belong to.
 */
export const FEED_POST_INSET = spacing.md;
