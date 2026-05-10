import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
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

  return (
    <ScreenBackground variant="default">
      <View style={styles.container}>
        <Text variant="title">Quick actions</Text>
        <Text variant="body" tone="secondary">
          Usa esta pantalla para probar el flujo nuevo de métricas, descanso y progreso.
        </Text>

        <ActionCard
          title="Registrar métricas"
          description="Abre el flujo de entrenamiento conectado al backend."
          onPress={() => router.push('/(add)/metrics')}
        />
        <ActionCard
          title="Registrar descanso"
          description="Envía progreso al endpoint nuevo sin imagen, ideal para validar la API."
          onPress={() => router.push('/(add)/rest-day')}
        />
        <ActionCard
          title="Ir a cámara"
          description="Atajo al flujo visual de captura y preview."
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