import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { safeBack } from '../../utils/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RestDayScreenBackground } from '../../components/layout/restDayScreenBackground';
import { IconButton } from '../../components/ui/iconButton';
import { Text } from '../../components/ui/text';
import { RestDayCalendar } from '../../components/add/restDay/RestDayCalendar';
import { getChallengeProgress } from '../../services/challenge/challenge.service';
import { useMetricsEntryStore } from '../../store/metricsEntryStore';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

export default function PlanRestDays() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const selectedChallengeId = useMetricsEntryStore((state) => state.selectedChallengeId);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [challengeBounds, setChallengeBounds] = useState<{ startDate: Date; totalDays: number } | null>(null);

  useEffect(() => {
    // Same bug/fix as rest-day.tsx (see its own doc comment): calling
    // getChallengeProgress() with no id checks the backend's fallback "most
    // recently joined active challenge," not the one actually selected —
    // this screen's calendar bounds (startDate/totalDays) would silently be
    // for the wrong challenge entirely.
    getChallengeProgress(selectedChallengeId ?? undefined).then((progress) => {
      if (!progress) return;
      const currentDay = progress.currentDay ?? 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - (currentDay - 1));
      setChallengeBounds({ startDate, totalDays: progress.totalDays });
    }).catch(() => {});
  }, [selectedChallengeId]);

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
      safeBack();
    } catch {
      Alert.alert(t('common.errors.genericTitle'), t('planRestDays.alerts.saveFailedMessage'));
    } finally {
      setSaving(false);
    }
  }

  const bottomBarHeight = Math.max(insets.bottom, spacing.lg) + spacing.md + 44;
  const setButtonDisabled = saving || selectedDates.size === 0;

  return (
    <RestDayScreenBackground>
      <View style={styles.screen}>
        <View style={styles.header}>
          <IconButton
            name="close-outline"
            onPress={() => safeBack()}
            size={44}
            iconSize={24}
            variant="ghost"
            iconColor={colors.ink}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={t('metrics.accessibilityBack')}
          />
        </View>

        <View style={styles.titleBlock}>
          <Text variant="title" align="center" inverse>{t('planRestDays.title')}</Text>
          <Text variant="body" tone="secondary" align="center" inverse>
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
          <Pressable
            onPress={handleSetRestDays}
            disabled={setButtonDisabled}
            style={({ pressed }) => [
              styles.setButton,
              pressed && !setButtonDisabled && styles.pressed,
              setButtonDisabled && styles.disabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.rest} />
            ) : (
              <Text variant="label" weight="bold" style={styles.setButtonText}>
                {t('planRestDays.setButton')}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </RestDayScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  iconButton: {
    marginLeft: -spacing.sm,
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
    backgroundColor: colors.rest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.ink, 0.15),
    alignItems: 'center',
  },
  setButton: {
    width: 220,
    paddingVertical: spacing.md,
    borderRadius: radius.big,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setButtonText: {
    color: colors.rest,
    opacity: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
