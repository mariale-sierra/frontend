import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Divider } from '../ui/divider';
import { Text } from '../ui/text';
import { spacing } from '../../constants/theme';

interface ChallengeSectionHeaderProps {
  title: string;
  style?: StyleProp<ViewStyle>;
}

export function ChallengeSectionHeader({ title, style }: ChallengeSectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text variant="label" style={styles.label}>{title}</Text>
      <Divider style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.sm,
  },
  divider: {
    marginHorizontal: -spacing.lg,
    width: 'auto',
  },
});