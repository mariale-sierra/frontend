import type { ImageSourcePropType } from 'react-native';

/**
 * Sprint 10: the empty-state illustrations — flat characters in the interface's
 * neutral palette (no activity colors), on transparent backgrounds. Their
 * near-black tones were lifted to a dark warm gray so they still read on the
 * app's dark screens. 512×512 PNGs, shown at EmptyState's ILLUSTRATION_SIZE.
 */
export const EMPTY_ILLUSTRATIONS = {
  homeNoChallenge: require('../assets/illustrations/empty-home-no-challenge.png') as ImageSourcePropType,
  feed: require('../assets/illustrations/empty-feed.png') as ImageSourcePropType,
  mineChallenges: require('../assets/illustrations/empty-mine-challenges.png') as ImageSourcePropType,
  profile: require('../assets/illustrations/empty-profile.png') as ImageSourcePropType,
};
