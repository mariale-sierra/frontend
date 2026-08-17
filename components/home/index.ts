// ActiveChallengeSection: Horizontally scrollable list of the user's active challenges.
// Each card shows the challenge name, current day progress, streak, completion badges,
// and time remaining. Uses snap scrolling so one card is always centered.
export * from './ActiveChallengeSection';

// FeedPostCard: Feed post card — author photo/overlay (via PhotoFrame), optional caption,
// likes/relative-time, and a "send a message" action pointing at the messaging placeholder route.
export * from './FeedPostCard';

// PostCardSkeleton: Loading placeholder matching FeedPostCard's size/layout, used while the feed loads.
export * from './PostCardSkeleton';

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
