import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';
import { useTranslation } from 'react-i18next';

interface RestDayOptionCardProps {
  onPress: () => void;
}

export function RestDayOptionCard({ onPress }: RestDayOptionCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {/* Gradients are retired — flat `rest` fill, which is exactly the
          semantic this card represents. See design system → Explicitly
          Rejected Patterns and → Status Card exception. */}
      <View style={styles.card}>
        <Text variant="header" inverse>{t('routineSelect.restDay.title')}</Text>
        <Text variant="caption" inverse tone="secondary">{t('routineSelect.restDay.description')}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 70,
    borderRadius: radius.big,
    backgroundColor: colors.rest,
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.82,
  },
});