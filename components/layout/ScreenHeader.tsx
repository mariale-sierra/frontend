import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BackButton } from '../ui/backButton';
import { Text } from '../ui/text';
import { spacing } from '../../constants/theme';

// `BackButton`'s width, and the width of the slot at the other end, so the title sits in
// the true middle of the row whichever of them is there.
const HEADER_SIDE_SIZE = 44;

interface ScreenHeaderProps {
  title: string;
  /** A line under the title — which challenge the screen is about. `secondary` text, or
   * `subtitleColor` (the challenge's own accent) when given. */
  subtitle?: string;
  subtitleColor?: string;
  /** Something at the right end (an icon button). Without it the slot stays empty, the
   * width of the back button, so the title stays centered. */
  trailing?: ReactNode;
}

/**
 * The header of a pushed screen: the back button, a centered title (and, under it, a
 * subtitle) and an optional trailing action. The one place this row is laid out, so the
 * screens that use it can't drift apart (they each had their own copy).
 */
export function ScreenHeader({ title, subtitle, subtitleColor, trailing }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <BackButton style={styles.side} />
      <View style={styles.titleBlock}>
        <Text variant="body" weight="bold" align="center" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="caption"
            weight="bold"
            align="center"
            numberOfLines={1}
            tone={subtitleColor ? 'primary' : 'secondary'}
            // A custom color on `Text` needs an explicit full opacity.
            style={subtitleColor ? { color: subtitleColor, opacity: 1 } : undefined}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.trailing}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    // The screen's own top inset is already applied by `ScreenBackground`; this is only
    // breathing room on top of it.
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  // The back button and the trailing slot are pulled out to the screen's margin by the
  // same amount, so they balance.
  side: {
    marginLeft: -spacing.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  trailing: {
    width: HEADER_SIDE_SIZE,
    alignItems: 'flex-end',
    marginRight: -spacing.sm,
  },
});
