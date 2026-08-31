import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Icon } from './icon';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface SegmentOption<T extends string> {
  value: T;
  icon: IconName;
  accessibilityLabel: string;
}

interface SegmentedIconToggleProps<T extends string> {
  value: T;
  options: [SegmentOption<T>, SegmentOption<T>];
  onChange: (value: T) => void;
  /** Active-segment fill — defaults to `colors.primary`. Pass a challenge's
   * own resolved accent color (Activity Color System v2) when this toggle
   * lives inside that challenge's own scoped UI (e.g. the Consistency
   * screen's grid/calendar toggle); leave unset for global/un-scoped uses
   * like Profile's posts/photos toggle, which should stay on `primary`. */
  activeColor?: string;
}

const SEGMENT_SIZE = { width: 64, height: 36 };
const INACTIVE_ICON_COLOR = withAlpha(colors.paper, textOpacity.tertiary);

/**
 * Generic 2-option icon segmented control — Components → Segmented control:
 * `surface` track, `big` radius, `xs` internal padding; active segment is a
 * filled pill (also `big` radius) — `primary` by default, or a challenge's
 * own accent color via `activeColor` (Activity Color System v2) when this
 * toggle lives inside that challenge's scoped UI. Inactive is transparent with a
 * `text-tertiary` icon. Extracted from `PostsViewToggle` (Profile's
 * posts/photos toggle, now a thin wrapper around this) when the Challenge
 * Detail screen's grid/calendar toggle needed the exact same chrome —
 * two icon-only 64×36 segments is the one confirmed pattern, not a
 * one-off per screen.
 */
export function SegmentedIconToggle<T extends string>({ value, options, onChange, activeColor = colors.primary }: SegmentedIconToggleProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.segment, value === option.value && { backgroundColor: activeColor }]}
          onPress={() => onChange(option.value)}
          accessibilityRole="button"
          accessibilityLabel={option.accessibilityLabel}
        >
          <Icon name={option.icon} size={20} color={value === option.value ? colors.ink : INACTIVE_ICON_COLOR} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  segment: {
    width: SEGMENT_SIZE.width,
    height: SEGMENT_SIZE.height,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
