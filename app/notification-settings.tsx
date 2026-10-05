import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../components/layout/screenBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Row } from '../components/layout/row';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { usePushPermission } from '../hooks/usePushPermission';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notifications/notifications.service';
import { colors, fillOpacity, radius, spacing } from '../constants/theme';
import { withAlpha } from '../utils/color';
import type {
  NotificationPreferenceContract,
  NotificationPreferenceUpdate,
} from '../types/notification';

const switchColors = {
  trackColor: { false: withAlpha(colors.paper, fillOpacity.chip), true: colors.success },
  thumbColor: colors.primary,
};

/**
 * Per-category notification settings, read from and saved to the backend
 * (GET/PATCH /notifications/preferences) — the categories themselves come
 * from there too. Plus this device's push permission state.
 */
export default function NotificationSettings() {
  const { t } = useTranslation();
  const push = usePushPermission();
  const [preferences, setPreferences] = useState<NotificationPreferenceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPreferences(await getNotificationPreferences());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const change = useCallback(
    async (update: NotificationPreferenceUpdate) => {
      const previous = preferences;
      // Optimistic; the server's answer is the final state.
      setPreferences((current) =>
        current.map((p) =>
          p.category === update.category
            ? {
                ...p,
                inAppEnabled: update.inAppEnabled ?? p.inAppEnabled,
                pushEnabled: update.pushEnabled ?? p.pushEnabled,
              }
            : p,
        ),
      );
      try {
        setPreferences(await updateNotificationPreferences([update]));
      } catch {
        // The shared API client already shows the error toast.
        setPreferences(previous);
      }
    },
    [preferences],
  );

  return (
    <ScreenBackground variant="default">
      <ScreenHeader title={t('notifications.preferences.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        {push.state ? (
          <View style={styles.card}>
            <Row align="center" justify="space-between" gap="md">
              <View style={styles.text}>
                <Text variant="body" weight="bold">
                  {t('notifications.preferences.deviceTitle')}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t(`notifications.preferences.deviceStatus.${push.state}`)}
                </Text>
              </View>
              {push.state === 'undetermined' || push.state === 'denied' ? (
                <Button size="sm" loading={push.requesting} disabled={push.requesting} onPress={push.enable}>
                  {t('notifications.push.enable')}
                </Button>
              ) : push.state === 'blocked' ? (
                <Button size="sm" variant="subtle" onPress={push.openSettings}>
                  {t('notifications.push.openSettings')}
                </Button>
              ) : null}
            </Row>
          </View>
        ) : null}

        <Text variant="caption" tone="secondary">
          {t('notifications.preferences.intro')}
        </Text>

        {loading ? (
          <View style={styles.list}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} height={96} radius={radius.medium} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text tone="secondary" align="center">
              {t('notifications.preferences.loadError')}
            </Text>
            <Button variant="outline" size="sm" onPress={load}>
              {t('notifications.retry')}
            </Button>
          </View>
        ) : (
          <View style={styles.list}>
            {preferences.map((preference) => (
              <CategoryRow key={preference.category} preference={preference} onChange={change} />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function CategoryRow({
  preference,
  onChange,
}: {
  preference: NotificationPreferenceContract;
  onChange: (update: NotificationPreferenceUpdate) => void;
}) {
  const { t } = useTranslation();
  const base = `notifications.preferences.categories.${preference.category}`;

  return (
    <View style={styles.card}>
      <View style={styles.text}>
        <Text variant="body" weight="bold">
          {t(`${base}.title`, { defaultValue: preference.category })}
        </Text>
        <Text variant="caption" tone="secondary">
          {t(`${base}.description`, { defaultValue: '' })}
        </Text>
      </View>
      <Row align="center" justify="space-between">
        <Text variant="label">{t('notifications.preferences.inApp')}</Text>
        <Switch
          value={preference.inAppEnabled}
          disabled={!preference.inAppConfigurable}
          onValueChange={(value) => onChange({ category: preference.category, inAppEnabled: value })}
          accessibilityLabel={`${t(`${base}.title`)}: ${t('notifications.preferences.inApp')}`}
          {...switchColors}
        />
      </Row>
      <Row align="center" justify="space-between">
        <Text variant="label">{t('notifications.preferences.push')}</Text>
        <Switch
          // Without the in-app notification there is nothing to push.
          value={preference.inAppEnabled && preference.pushEnabled}
          disabled={!preference.inAppEnabled}
          onValueChange={(value) => onChange({ category: preference.category, pushEnabled: value })}
          accessibilityLabel={`${t(`${base}.title`)}: ${t('notifications.preferences.push')}`}
          {...switchColors}
        />
      </Row>
      {!preference.inAppConfigurable ? (
        <Text variant="caption" tone="tertiary">
          {t('notifications.preferences.lockedHint')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  center: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
});
