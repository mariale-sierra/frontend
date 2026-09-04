import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { MuscleListItem } from './muscleListItem';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getMuscleRegions, getMusclesInRegion } from '../../services/exercises/exercises.service';
import type { MuscleRegionSummary, MuscleSummary } from '../../services/exercises/exercises.service';

interface MuscleFilterSheetProps {
  visible: boolean;
  selectedCode: string | null;
  selectedLabel: string | null;
  onSelect: (code: string | null, label: string | null) => void;
  onClose: () => void;
}

/** The Muscles filter is a two-step picker (region -> muscle), mirroring the
 * Muscle Browser screen's own navigation shape — same mental model, and
 * every muscle row always shows its image here too. */
export function MuscleFilterSheet({ visible, selectedCode, selectedLabel, onSelect, onClose }: MuscleFilterSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [regions, setRegions] = useState<MuscleRegionSummary[]>([]);
  const [activeRegion, setActiveRegion] = useState<MuscleRegionSummary | null>(null);
  const [muscles, setMuscles] = useState<MuscleSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setActiveRegion(null);
      return;
    }
    getMuscleRegions()
      .then(setRegions)
      .catch((error: any) => console.error('[MuscleFilterSheet] regions', error?.message));
  }, [visible]);

  useEffect(() => {
    if (!activeRegion) return;
    setLoading(true);
    getMusclesInRegion(activeRegion.code)
      .then(setMuscles)
      .catch((error: any) => console.error('[MuscleFilterSheet] muscles', error?.message))
      .finally(() => setLoading(false));
  }, [activeRegion]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.header}>
          {activeRegion ? (
            <Pressable onPress={() => setActiveRegion(null)} hitSlop={8} style={styles.backIcon}>
              <Icon name="chevron-back-outline" size={20} />
            </Pressable>
          ) : (
            <View style={styles.backIcon} />
          )}
          <Text variant="header" size="lg" weight="bold" style={styles.title}>
            {activeRegion ? activeRegion.name : t('exerciseCatalog.filters.muscles')}
          </Text>
        </View>

        {!activeRegion && selectedCode && (
          <Pressable
            style={({ pressed }) => [styles.clearRow, pressed && styles.rowPressed]}
            onPress={() => onSelect(null, null)}
          >
            <Text variant="body" tone="secondary">
              {t('exerciseCatalog.filters.all')}
            </Text>
          </Pressable>
        )}

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {!activeRegion ? (
            regions.map((region) => (
              <Pressable
                key={region.code}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => setActiveRegion(region)}
              >
                <Text variant="body" weight="medium">
                  {t(`exerciseCatalog.regions.${region.code}` as never)}
                </Text>
                <Icon name="chevron-forward-outline" size={18} color={colors.neutral} />
              </Pressable>
            ))
          ) : loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <View style={styles.muscleList}>
              {muscles.map((muscle) => (
                <MuscleListItem
                  key={muscle.code}
                  name={t(`exerciseCatalog.muscles.${muscle.code}` as never)}
                  imageUrl={muscle.iconUrl}
                  onPress={() => onSelect(muscle.code, t(`exerciseCatalog.muscles.${muscle.code}` as never))}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: withAlpha('#000000', 0.5),
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.big,
    borderTopRightRadius: radius.big,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    maxHeight: '75%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backIcon: {
    width: 24,
  },
  title: {
    flex: 1,
  },
  clearRow: {
    paddingVertical: spacing.sm,
  },
  list: {
    flexGrow: 0,
  },
  muscleList: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(colors.paper, 0.08),
  },
  rowPressed: {
    opacity: 0.7,
  },
  loading: {
    paddingVertical: spacing.xl,
  },
});
