import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { RestDayPrimaryButton } from './RestDayPrimaryButton';
import { colors, radius, spacing } from '../../../constants/theme';

interface RestDayContentProps {
  onJustToday: () => void;
  onPlanRestDays: () => void;
  loading?: boolean;
  error?: string | null;
}

/** Rest-Or-Plan-28C wireframe — sits on `RestDayScreenBackground`'s solid
 * `rest`-purple + white-highlight gradient, so every element here is `ink`
 * (dark), not the usual `paper` (light-on-dark) default. Neither button
 * matches an existing `Button` variant (this screen's own color pairing —
 * solid `ink`/`rest` text, and transparent/`ink`-bordered/`ink` text — isn't
 * used anywhere else), so both are built as plain `Pressable`s with real
 * tokens rather than stretching the shared component to fit a one-off. */
export function RestDayContent({
  onJustToday,
  onPlanRestDays,
  loading = false,
  error,
}: RestDayContentProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <Ionicons name="moon-outline" size={72} color={colors.ink} />

        <View style={styles.textGroup}>
          <Text variant="body" size="2xl" weight="bold" align="center" inverse>
            {t('restDay.title')}
          </Text>
          <Text variant="body" tone="secondary" align="center" inverse style={styles.subtitle}>
            {t('restDay.subtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {error ? (
          <Text variant="caption" align="center" style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        <RestDayPrimaryButton
          label={t('restDay.justTodayButton')}
          onPress={onJustToday}
          loading={loading}
        />

        <Pressable
          onPress={onPlanRestDays}
          disabled={loading}
          style={({ pressed }) => [styles.planButton, pressed && styles.pressed]}
        >
          <Text variant="label" weight="bold" style={styles.planText}>
            {t('restDay.planButton')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  textGroup: {
    gap: spacing.md,
    alignItems: 'center',
  },
  subtitle: {
    maxWidth: 280,
  },
  actions: {
    gap: spacing.sm,
  },
  planButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.big,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planText: {
    color: colors.ink,
    opacity: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});
