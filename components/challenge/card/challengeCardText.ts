import { StyleSheet } from 'react-native';
import { colors } from '../../../constants/theme';

/**
 * The challenge cards' text colors, fully opaque. `Text`'s tone-opacity (85% by
 * default) applies even to a custom `color`, so it is cancelled back here —
 * shared by every piece of the glow cards so they can't drift apart.
 *
 * - `primary`: the warm off-white `primary` — titles, counts, numbers.
 * - `paper`: plain `paper` white — for small labels that need to stand out
 *   against the glow (the Explore ring's "days").
 */
export const challengeCardText = StyleSheet.create({
  primary: {
    color: colors.primary,
    opacity: 1,
  },
  paper: {
    color: colors.paper,
    opacity: 1,
  },
});
