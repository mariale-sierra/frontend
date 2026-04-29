import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui/text';
import { gradients, radius, spacing } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

interface RestDayOptionCardProps {
  onPress: () => void;
}

export function RestDayOptionCard({ onPress }: RestDayOptionCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <LinearGradient
        colors={gradients.restDay.colors}
        start={gradients.restDay.start}
        end={gradients.restDay.end}
        style={styles.card}
      >
        <Text variant="header" tone="primary">{t('routineSelect.restDay.title')}</Text>
        <Text variant="caption" style={styles.text}>{t('routineSelect.restDay.description')}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 70,
    borderRadius: radius.xl,
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: spacing.md,
  },
  text: {
    color: 'rgba(255,255,255,0.82)',
  },
  pressed: {
    opacity: 0.82,
  },
});