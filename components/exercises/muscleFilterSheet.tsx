import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { IconButton } from '../ui/iconButton';
import { MuscleListItem } from './muscleListItem';
import { BottomSheetModal } from '../ui/bottomSheetModal';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getMuscleRegions, getMusclesInRegion } from '../../services/exercises/exercises.service';
import type { MuscleRegionSummary, MuscleSummary } from '../../services/exercises/exercises.service';

export interface MuscleFilterSelection {
  /** 'region' filters by every muscle in that region; 'muscle' filters by
   * exactly one muscle — a deliberately different query, not two labels for
   * the same thing (see the region row vs. muscle row interactions below). */
  level: 'region' | 'muscle';
  code: string;
  label: string;
}

interface MuscleFilterSheetProps {
  visible: boolean;
  selected: MuscleFilterSelection | null;
  onSelect: (selection: MuscleFilterSelection | null) => void;
  onClose: () => void;
}

/** The Muscles filter is a two-step picker (region -> muscle), mirroring the
 * Muscle Browser screen's own navigation shape — same mental model, and
 * every row (region or muscle) always shows its image here too.
 *
 * Region rows carry TWO separate tap targets: tapping the row itself
 * selects that whole region (filters by every muscle it contains), tapping
 * the trailing chevron drills into its child muscles instead — picking a
 * specific one there filters by that single muscle. Two different filters,
 * kept visibly distinct rather than one row that always drills in. */
export function MuscleFilterSheet({ visible, selected, onSelect, onClose }: MuscleFilterSheetProps) {
  const { t } = useTranslation();
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

  function selectRegion(region: MuscleRegionSummary) {
    onSelect({ level: 'region', code: region.code, label: t(`exerciseCatalog.regions.${region.code}` as never) });
  }

  function selectMuscle(muscle: MuscleSummary) {
    onSelect({ level: 'muscle', code: muscle.code, label: t(`exerciseCatalog.muscles.${muscle.code}` as never) });
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeight="75%">
      <View style={styles.header}>
        {activeRegion ? (
          <Pressable onPress={() => setActiveRegion(null)} hitSlop={8} style={styles.backIcon}>
            <Icon name="chevron-back-outline" size={20} />
          </Pressable>
        ) : (
          <View style={styles.backIcon} />
        )}
        <Text variant="header" size="lg" weight="bold" style={styles.title}>
          {activeRegion ? t(`exerciseCatalog.regions.${activeRegion.code}` as never) : t('exerciseCatalog.filters.muscles')}
        </Text>
      </View>

      {!activeRegion && selected && (
        <Pressable
          style={({ pressed }) => [styles.clearRow, pressed && styles.rowPressed]}
          onPress={() => onSelect(null)}
        >
          <Text variant="body" tone="secondary">
            {t('exerciseCatalog.filters.all')}
          </Text>
        </Pressable>
      )}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {!activeRegion ? (
          <View style={styles.regionList}>
            {regions.map((region) => (
              <Pressable
                key={region.code}
                style={({ pressed }) => [styles.regionRow, pressed && styles.rowPressed]}
                onPress={() => selectRegion(region)}
              >
                <View style={styles.thumbnail}>
                  {region.iconUrl ? (
                    <Image source={{ uri: region.iconUrl }} style={styles.thumbnailImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.thumbnailPlaceholder} />
                  )}
                </View>
                <Text variant="body" weight="medium" style={styles.regionLabel}>
                  {t(`exerciseCatalog.regions.${region.code}` as never)}
                </Text>
                {selected?.level === 'region' && selected.code === region.code && (
                  <Icon name="checkmark-outline" size={18} color={colors.primary} />
                )}
                <IconButton
                  name="chevron-forward-outline"
                  size={32}
                  iconSize={18}
                  iconColor={colors.neutral}
                  onPress={() => setActiveRegion(region)}
                  accessibilityRole="button"
                  accessibilityLabel={t('exerciseCatalog.muscleBrowser.title')}
                />
              </Pressable>
            ))}
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          <View style={styles.muscleList}>
            {muscles.map((muscle) => (
              <MuscleListItem
                key={muscle.code}
                name={t(`exerciseCatalog.muscles.${muscle.code}` as never)}
                imageUrl={muscle.iconUrl}
                selected={selected?.level === 'muscle' && selected.code === muscle.code}
                onPress={() => selectMuscle(muscle)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
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
  regionList: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    paddingLeft: spacing.base,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
  },
  regionLabel: {
    flex: 1,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: radius.small,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: withAlpha(colors.paper, 0.06),
  },
  muscleList: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  loading: {
    paddingVertical: spacing.xl,
  },
});
