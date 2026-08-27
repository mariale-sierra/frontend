// ActiveChallengeSection: Horizontally scrollable list of the user's active challenges.
// Each card shows the challenge name, current day progress, streak, completion badges,
// and time remaining. Uses snap scrolling so one card is always centered.
export * from './ActiveChallengeSection';

// FeedPostCard: Feed post card — header row (avatar/username/timestamp) above the
// photo, optional caption, likes/relative-time, and a "send a message" action
// pointing at the messaging placeholder route. PhotoDetailCard (components/ui)
// mirrors this same header-row-above-the-photo structure for photo detail views.
export * from './FeedPostCard';

// PostCardSkeleton: Loading placeholder matching FeedPostCard's size/layout, used while the feed loads.
export * from './PostCardSkeleton';

// HomeContentSkeleton: One combined placeholder (hero + streaks + feed) shown
// until every Home fetch is done, so sections reveal together instead of
// popping in one by one. Built from components/ui/skeleton's Skeleton primitive.
export * from './HomeContentSkeleton';

// EmptyFeed: Centered icon+text state shown when the feed loaded successfully but has no posts.
export * from './EmptyFeed';

// FeedErrorState: Centered icon+text state shown when the feed request failed.
export * from './FeedErrorState';

// FriendStreakCard: Compact card for one friend's streak (avatar, name, day count),
// accent-colored per user. UI-only — no backend endpoint for friends' streaks exists yet.
export * from './FriendStreakCard';

// FriendsStreakSection: Header + horizontal list of FriendStreakCard, with its own
// loading/empty/error states and a "see more" action. Feed data is passed in via props.
export * from './FriendsStreakSection';

// StreakGridItem: One tile in the Streaks-All 4-column grid (avatar + overlapping
// count badge + name) — same badge treatment as FriendStreakCard, plus an optional
// `primary` ring for the signed-in user's own tile.
export * from './StreakGridItem';

// StreaksGridSkeleton: Placeholder grid matching StreakGridItem's shape,
// shown while the Streaks-All screen's one fetch is in flight.
export * from './StreaksGridSkeleton';
