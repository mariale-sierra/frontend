import { StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { Button } from '../../ui/button';
import { RestDayIconExperimental } from '../../icons/restDayIconExperimental';
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
  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <RestDayIconExperimental />

        <View style={styles.textGroup}>
          <Text variant="title" align="center">{'Rest days\nmatter too.'}</Text>
          <Text variant="body" tone="secondary" align="center" style={styles.subtitle}>
            Do you want to take today off, or schedule more rest days?
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {error ? (
          <Text variant="caption" align="center" style={styles.errorText}>
            {error}
          </Text>
        ) : null}
        <Button variant="primary" size="md" onPress={onJustToday} loading={loading}>
          Just today
        </Button>
        <Button variant="outline" size="md" onPress={onPlanRestDays} disabled={loading}>
          Plan rest days
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
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});
