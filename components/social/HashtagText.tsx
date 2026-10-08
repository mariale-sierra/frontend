import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../ui/text';
import { activityColors } from '../../constants/theme';
import { splitHashtags } from '../../utils/hashtags';

type HashtagTextProps = Omit<ComponentProps<typeof Text>, 'children'> & {
  children: string;
};

/**
 * Caption text with its #hashtags highlighted inline (Sprint 9, B5). The
 * tags aren't tappable yet — there's no hashtag search screen this sprint —
 * but the backend already stores them relationally for that.
 */
export function HashtagText({ children, ...textProps }: HashtagTextProps) {
  return (
    <Text {...textProps}>
      {splitHashtags(children).map((segment, index) =>
        segment.kind === 'hashtag' ? (
          <Text key={index} variant={textProps.variant} size={textProps.size} style={styles.hashtag}>
            {segment.text}
          </Text>
        ) : (
          segment.text
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  // Hashtags read as links: the palette's electric blue (the `flexibility`
  // activity color), same weight as the caption around them, no pill.
  // Custom color on `Text` needs `opacity: 1` (see components/ui/text.tsx).
  hashtag: {
    color: activityColors.flexibility,
    opacity: 1,
  },
});
