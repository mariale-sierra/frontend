import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { Button } from '../../ui/button';
import { RestDayIconExperimental } from '../../icons/restDayIconExperimental';
import { colors, spacing } from '../../../constants/theme';

interface RestDayAlreadyLoggedProps {
  onBack: () => void;
  onPlanRestDays: () => void;
}

export function RestDayAlreadyLogged({ onBack, onPlanRestDays }: RestDayAlreadyLoggedProps) {
  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <RestDayIconExperimental />

        <View style={styles.textGroup}>
          <Text variant="title" align="center">{"Today's\nalready done."}</Text>
          <Text variant="body" tone="secondary" align="center" style={styles.subtitle}>
            Your workout is logged for today. Rest days can't be applied retroactively — but you can plan ahead.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button variant="outline" size="md" onPress={onPlanRestDays}>
          Plan rest days
        </Button>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text variant="label" style={styles.backLinkText}>Go back</Text>
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
    gap: spacing.md,
    alignItems: 'center',
  },
  backLink: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  backLinkText: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.6,
  },
});
