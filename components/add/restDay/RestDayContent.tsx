import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { Button } from '../../ui/button';
import { RestDayIcon } from '../../icons/restDayIcon';
import { colors, spacing } from '../../../constants/theme';

interface RestDayContentProps {
  onJustToday: () => void;
  onPlanRestDays: () => void;
  loading?: boolean;
  error?: string | null;
}

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
        <RestDayIcon />

        <View style={styles.textGroup}>
          <Text variant="title" align="center">{t('restDay.title')}</Text>
          <Text variant="body" tone="secondary" align="center" style={styles.subtitle}>
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
        <Button variant="primary" size="md" onPress={onJustToday} loading={loading} style={styles.actionButton}>
          {t('restDay.justTodayButton')}
        </Button>
        <Button
          variant="primary"
          size="md"
          onPress={onPlanRestDays}
          disabled={loading}
          style={[styles.actionButton, styles.planButton]}
        >
          {t('restDay.planButton')}
        </Button>
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
    gap: spacing.md,
    alignItems: 'center',
  },
  actionButton: {
    width: 220,
  },
  // `primary` variant base (solid bg, `ink` text) with the fill overridden
  // to `rest` — no separate "solid rest button" variant exists on the
  // shared Button component for what's currently a single-flow use case.
  planButton: {
    backgroundColor: colors.rest,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});
