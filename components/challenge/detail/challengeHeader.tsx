import { StyleSheet, View } from 'react-native';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

type IconName = React.ComponentProps<typeof Icon>['name'];

export interface ChallengeInfoRow {
  icon: IconName;
  /** Defaults to `colors.paper` — the wireframe colors exactly one row's icon (`secondary`, "Lasts") and leaves the rest neutral. */
  iconColor?: string;
  label: string;
  value: string;
}

interface ChallengeHeaderProps {
  title: string;
  rows: ChallengeInfoRow[];
}

/** Title + info-rows block at the top of Challenge-Info — left-aligned Bebas
 * Neue title, then icon/label/value rows each hairline-separated (all four,
 * including the last, per the wireframe). Replaces the old centered
 * giant-day-count/location-icon-grid/activity-badge-chip layout, which
 * doesn't appear in this wireframe at all. */
export default function ChallengeHeader({ title, rows }: ChallengeHeaderProps) {
  return (
    <View>
      <Text variant="title" style={styles.title}>{title}</Text>

      <View style={styles.rows}>
        {rows.map((row, index) => (
          <View key={`${row.label}-${index}`} style={styles.row}>
            <View style={styles.iconWrap}>
              <Icon name={row.icon} size={22} color={row.iconColor ?? colors.paper} />
            </View>
            <View style={styles.textColumn}>
              <Text variant="caption" tone="secondary">{row.label}</Text>
              <Text variant="body" weight="bold" style={styles.value}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  rows: {
    paddingHorizontal: spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(colors.paper, 0.08),
  },
  iconWrap: {
    width: 24,
    alignItems: 'center',
    flexShrink: 0,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    opacity: 1,
  },
});
