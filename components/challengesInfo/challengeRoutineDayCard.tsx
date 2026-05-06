import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import { ActivityIcon } from '../icons/activityIcon';
import { Row } from '../layout/row';
import { colors, spacing, type ActivityType } from '../../constants/theme';

type Props = {
  day: number;
  title: string;
  activity?: ActivityType;
  onPress?: () => void;
};

export default function ChallengeRoutineDayCard({
  day,
  title,
  activity,
  onPress,
}: Props) {
  return (
    <Card style={styles.card} variant="basic" onPress={onPress}>
      <Row justify="space-between" align="stretch" style={styles.cardRow}>
        <View style={styles.leftIconWrap}>
          {activity ? <ActivityIcon type={activity} size="md" variant="plain" /> : null}
        </View>

        <View style={styles.centerTextColumn}>
          <Text variant="caption" style={styles.dayLabel}>Day {day}</Text>
          <Text variant="header" tone="primary" style={styles.title}>{title}</Text>
        </View>

        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.chevronButton, pressed && styles.pressed]}
          hitSlop={10}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </Pressable>
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 80,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardRow: {
    width: '100%',
  },
  leftIconWrap: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextColumn: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    opacity: 0.9,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    marginTop: spacing.xxs,
  },
  chevronButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
});