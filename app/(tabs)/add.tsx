import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Text } from '../../components/ui/text';
import { colors, radius, spacing } from '../../constants/theme';

function ActionCard({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text variant="subheader">{title}</Text>
      <Text variant="body" tone="secondary">{description}</Text>
    </Pressable>
  );
}

export default function Add() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScreenBackground variant="default">
      <View style={styles.container}>
        <Text variant="title">{t('addMenu.title')}</Text>
        <Text variant="body" tone="secondary">
          {t('addMenu.subtitle')}
        </Text>

        <ActionCard
          title={t('addMenu.metrics.title')}
          description={t('addMenu.metrics.description')}
          onPress={() => router.push('/(add)/metrics')}
        />
        <ActionCard
          title={t('addMenu.restDay.title')}
          description={t('addMenu.restDay.description')}
          onPress={() => router.push('/(add)/rest-day')}
        />
        <ActionCard
          title={t('addMenu.camera.title')}
          description={t('addMenu.camera.description')}
          onPress={() => router.push('/(add)/camera')}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
});