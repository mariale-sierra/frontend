import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { ActivityIcon } from '../icons/activityIcon';
import { routineStyles } from './routineStyles';
import { colors, spacing, ActivityType } from '../../constants/theme';

interface ExerciseListItemProps {
  name: string;
  location: string;
  activityType: ActivityType;
  onAdd: () => void;
}

export function ExerciseListItem({ name, location, activityType, onAdd }: ExerciseListItemProps) {
  return (
    <Pressable
      onPress={onAdd}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={routineStyles.divider} />
      <View style={styles.content}>
        <ActivityIcon type={activityType} size="sm" variant="plain" />
        <View style={styles.text}>
          <Text variant="header" tone="primary" numberOfLines={1}>{name}</Text>
          <Text variant="caption">{location}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
});