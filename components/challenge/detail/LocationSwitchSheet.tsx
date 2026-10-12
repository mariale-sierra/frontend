import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../../ui/bottomSheetModal';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { Row } from '../../layout/row';
import { borderWidth, colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { toTitleCase } from '../../../utils/format';
import { useLocationSwitch, type RoutineExerciseRef } from '../../../hooks/useLocationSwitch';
import type { WorkoutAdaptation } from '../../../store/workoutAdaptationStore';

const CHECK_ICON_SIZE = 14;
const CHECK_SIZE = 22;

interface LocationSwitchSheetProps {
  visible: boolean;
  onClose: () => void;
  routineId: number | null;
  exercises: RoutineExerciseRef[];
  current: WorkoutAdaptation | null;
  onApply: (adaptation: WorkoutAdaptation) => void;
  /** Drops the user's choice and goes back to the routine as written. */
  onReset: () => void;
}

/**
 * "Change location" (Sprint 9, B7): pick where you are training; exercises that
 * do not fit there can be swapped for compatible alternatives (same metrics,
 * so targets and results stay with the right exercise). The choice is the
 * user's own and never touches the routine other participants see.
 */
export function LocationSwitchSheet({
  visible,
  onClose,
  routineId,
  exercises,
  current,
  onApply,
  onReset,
}: LocationSwitchSheetProps) {
  const { t } = useTranslation();
  const flow = useLocationSwitch({ visible, routineId, exercises, current });

  function apply() {
    const adaptation = flow.buildAdaptation();
    if (!adaptation) return;
    onApply(adaptation);
    onClose();
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} height="75%" glass>
      <View style={styles.fill}>
        <Text variant="subheader" align="center" style={styles.title}>
          {flow.selected ? t('challengeRoutineDay.location.substitutionsTitle', { location: flow.selected.name }) : t('challengeRoutineDay.location.sheetTitle')}
        </Text>

        <ScrollView style={styles.fill} showsVerticalScrollIndicator={false}>
          {flow.loadError ? (
            <Text variant="body" tone="secondary" align="center">{t('challengeRoutineDay.location.loadError')}</Text>
          ) : flow.locations === null ? (
            <ActivityIndicator color={colors.primary} />
          ) : !flow.selected ? (
            flow.locations.map((location) => {
              const active = current?.locationCode === location.code;
              return (
                <Row
                  key={location.code}
                  pressable
                  onPress={() => flow.selectLocation(location)}
                  align="center"
                  gap="md"
                  accessibilityRole="button"
                  accessibilityLabel={location.name}
                  style={styles.locationRow}
                >
                  <View style={styles.fill}>
                    <Text variant="body" weight="bold">{location.name}</Text>
                    <Text variant="caption" tone="secondary">
                      {location.requiresSubstitution
                        ? t('challengeRoutineDay.location.needsSwaps', { count: location.unsupportedExerciseIds.length })
                        : t('challengeRoutineDay.location.worksAsWritten')}
                    </Text>
                  </View>
                  {active ? <Icon name="checkmark-outline" size={CHECK_ICON_SIZE} color={colors.primary} /> : null}
                </Row>
              );
            })
          ) : (
            <View style={styles.swapList}>
              {flow.items.length === 0 ? (
                <Text variant="body" tone="secondary">{t('challengeRoutineDay.location.noSwapsNeeded', { location: flow.selected.name })}</Text>
              ) : null}
              {flow.items.map((item) => (
                <View key={item.exerciseId} style={styles.swapItem}>
                  <Text variant="label" weight="bold">
                    {t('challengeRoutineDay.location.replace', { name: toTitleCase(item.name) })}
                  </Text>
                  {item.alternatives === null ? (
                    <ActivityIndicator color={colors.primary} style={styles.itemSpinner} />
                  ) : item.alternatives.length === 0 ? (
                    <Text variant="caption" tone="secondary">
                      {item.failed
                        ? t('challengeRoutineDay.location.alternativesFailed')
                        : t('challengeRoutineDay.location.noAlternatives', { location: flow.selected?.name })}
                    </Text>
                  ) : (
                    item.alternatives.map((alternative) => {
                      const picked = item.chosenId === alternative.id;
                      return (
                        <Row
                          key={alternative.id}
                          pressable
                          onPress={() => flow.choose(item.exerciseId, alternative.id)}
                          align="center"
                          gap="md"
                          accessibilityRole="radio"
                          accessibilityState={{ selected: picked }}
                          style={styles.alternativeRow}
                        >
                          <Text variant="body" numberOfLines={1} style={styles.fill}>{toTitleCase(alternative.name)}</Text>
                          <View style={[styles.check, picked && styles.checkSelected]}>
                            {picked ? <Icon name="checkmark-outline" size={CHECK_ICON_SIZE} color={colors.ink} /> : null}
                          </View>
                        </Row>
                      );
                    })
                  )}
                </View>
              ))}
              {flow.withoutAlternatives.length > 0 ? (
                <Text variant="caption" tone="secondary" style={styles.warning}>
                  {t('challengeRoutineDay.location.keptAsWritten', { count: flow.withoutAlternatives.length })}
                </Text>
              ) : null}
            </View>
          )}
        </ScrollView>

        {flow.selected ? (
          <Row gap="md" style={styles.actions}>
            <Button variant="subtle" onPress={flow.backToLocations} style={styles.fill}>
              {t('common.actions.back')}
            </Button>
            <Button variant="primary" disabled={!flow.canApply} onPress={apply} style={styles.fill}>
              {t('challengeRoutineDay.location.apply')}
            </Button>
          </Row>
        ) : current ? (
          <Button
            variant="subtle"
            onPress={() => {
              onReset();
              onClose();
            }}
            style={styles.actions}
          >
            {t('challengeRoutineDay.location.reset')}
          </Button>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { paddingBottom: spacing.md },
  locationRow: { paddingVertical: spacing.md },
  swapList: { gap: spacing.lg, paddingBottom: spacing.md },
  swapItem: { gap: spacing.xs },
  itemSpinner: { alignSelf: 'flex-start' },
  alternativeRow: { paddingVertical: spacing.sm },
  warning: { paddingTop: spacing.xs },
  actions: { marginTop: spacing.sm },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: radius.big,
    borderWidth: borderWidth.thin,
    borderColor: withAlpha(colors.paper, textOpacity.tertiary),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
