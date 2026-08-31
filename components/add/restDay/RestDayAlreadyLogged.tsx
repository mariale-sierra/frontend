import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { Button } from '../../ui/button';
import { RestDayIcon } from '../../icons/restDayIcon';
import { colors, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface RestDayAlreadyLoggedProps {
  onBack: () => void;
  onPlanRestDays: () => void;
}

export function RestDayAlreadyLogged({ onBack, onPlanRestDays }: RestDayAlreadyLoggedProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <RestDayIcon />

        <View style={styles.textGroup}>
          <Text variant="title" align="center">{t('restDay.alreadyLogged.title')}</Text>
          <Text variant="body" tone="secondary" align="center" style={styles.subtitle}>
            {t('restDay.alreadyLogged.subtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="md"
          onPress={onPlanRestDays}
          style={[styles.actionButton, styles.planButton]}
        >
          {t('restDay.planButton')}
        </Button>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('restDay.alreadyLogged.backLink')}
        >
          <Text variant="label" style={styles.backLinkText}>{t('restDay.alreadyLogged.backLink')}</Text>
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
  actionButton: {
    width: 220,
  },
  // `primary` variant base (solid bg, `ink` text) with the fill overridden
  // to `rest` — no separate "solid rest button" variant exists on the
  // shared Button component for what's currently a single-flow use case.
  planButton: {
    backgroundColor: colors.rest,
  },
  backLink: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  backLinkText: {
    color: withAlpha(colors.paper, textOpacity.secondary),
    opacity: 1,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.6,
  },
});
