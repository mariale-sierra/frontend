import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors, radius, spacing } from '../../constants/theme';
import { Text } from '../../components/ui/text';
import { getChallenges } from '../../services/challenge/challenge.service';
import { getMyChallenges } from '../../services/user/user.service';
import type { ChallengeContract } from '../../types/challenge';
import { useRouter } from 'expo-router';

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [available, setAvailable] = useState<ChallengeContract[]>([]);

  useEffect(() => {
    Promise.all([getChallenges(), getMyChallenges()])
      .then(([allChallenges, myChallenges]) => {
        const joinedIds = new Set(myChallenges.map((c) => String(c.id)));
        const filtered = allChallenges.filter((c) => !joinedIds.has(String(c.id)));
        setAvailable(filtered);
      })
      .catch(() => setError('No se pudieron cargar los challenges.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return available;
    return available.filter((challenge) =>
      challenge.name?.toLowerCase().includes(lower),
    );
  }, [available, query]);

  return (
    <ScreenBackground variant="challenges" applyTopInset={false}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
      >
        <Text variant="title">Buscar challenges</Text>
        <Text variant="body" tone="secondary">
          Muestra todos los challenges a los que no te has unido.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre"
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={styles.searchInput}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text tone="secondary">{error}</Text>
        ) : filtered.length === 0 ? (
          <Text tone="secondary">No hay challenges disponibles.</Text>
        ) : (
          <View style={styles.list}>
            {filtered.map((challenge) => (
              <Pressable
                key={String(challenge.id)}
                onPress={() => router.push(`/challenge/${challenge.id}`)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <Text variant="subheader">{challenge.name}</Text>
                <Text variant="body" tone="secondary">
                  {challenge.description ?? 'Sin descripcion'}
                </Text>
                <Text variant="caption" tone="secondary">
                  {challenge.duration_days ?? '--'} dias
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  searchInput: {
    minHeight: 46,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
  },
  center: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.sm,
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
