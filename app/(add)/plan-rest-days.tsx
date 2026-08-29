import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { IconButton } from '../../components/ui/iconButton';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { RestDayCalendar } from '../../components/add/restDay/RestDayCalendar';
import { getChallengeProgress } from '../../services/challenge/challenge.service';
import { colors, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

export default function PlanRestDays() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [challengeBounds, setChallengeBounds] = useState<{ startDate: Date; totalDays: number } | null>(null);

  useEffect(() => {
    getChallengeProgress().then((progress) => {
      if (!progress) return;
      const currentDay = progress.currentDay ?? 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - (currentDay - 1));
      setChallengeBounds({ startDate, totalDays: progress.totalDays });
    }).catch(() => {});
  }, []);

  const handleToggleDate = useCallback((dateKey: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  }, []);

  async function handleSetRestDays() {
    if (selectedDates.size === 0) {
      Alert.alert(t('planRestDays.alerts.noDaysSelectedTitle'), t('planRestDays.alerts.noDaysSelectedMessage'));
      return;
    }
    setSaving(true);
    try {
      // TODO: wire up API endpoint for scheduling future rest days
      await Promise.resolve();
      router.back();
    } catch {
      Alert.alert(t('common.errors.genericTitle'), t('planRestDays.alerts.saveFailedMessage'));
    } finally {
      setSaving(false);
    }
  }

  const bottomBarHeight = Math.max(insets.bottom, spacing.lg) + spacing.md + 44;

  return (
    <ScreenBackground variant="top">
      <View style={styles.screen}>
        <View style={styles.header}>
          <IconButton
            name="chevron-back-outline"
            onPress={() => router.back()}
            size={28}
            iconSize={18}
            variant="ghost"
            accessibilityRole="button"
            accessibilityLabel={t('metrics.accessibilityBack')}
          />
        </View>

        <View style={styles.titleBlock}>
          <Text variant="title" align="center">{t('planRestDays.title')}</Text>
          <Text variant="body" tone="secondary" align="center">
            {t('planRestDays.subtitle')}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomBarHeight + spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          {challengeBounds && (
            <RestDayCalendar
              startDate={challengeBounds.startDate}
              totalDays={challengeBounds.totalDays}
              selectedDates={selectedDates}
              onToggleDate={handleToggleDate}
            />
          )}
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <Button
            variant="primary"
            size="md"
            onPress={handleSetRestDays}
            loading={saving}
            disabled={selectedDates.size === 0}
            style={styles.actionButton}
          >
            {t('planRestDays.setButton')}
          </Button>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titleBlock: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: withAlpha(colors.ink, 0.88),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
    alignItems: 'center',
  },
  actionButton: {
    width: 220,
  },
});
