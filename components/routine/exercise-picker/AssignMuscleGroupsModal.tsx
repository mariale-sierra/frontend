import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { Button } from '../../ui/button';
import { getBodyParts, type BodyPart } from '../../../services/exercises/exercises.service';
import { colors, radius, spacing } from '../../../constants/theme';

interface AssignMuscleGroupsModalProps {
  visible: boolean;
  exerciseName: string;
  onClose: () => void;
  onConfirm: (muscleGroups: string[]) => void;
}

/**
 * Shown when adding an exercise to a routine day, so the exercise gets tagged
 * with the muscle group(s) it works — otherwise `muscle_groups` stays empty
 * end-to-end and the "browse by muscle" picker has nothing to filter on.
 * Only level-1 (specific) body parts are offered; level-0 regions (Upper
 * Body/Lower Body/Core Region) are just grouping headers, not selectable tags.
 */
export function AssignMuscleGroupsModal({
  visible,
  exerciseName,
  onClose,
  onConfirm,
}: AssignMuscleGroupsModalProps) {
  const { t } = useTranslation();
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    getBodyParts()
      .then((data) => {
        if (active) setBodyParts(data.filter((bp) => bp.level > 0));
      })
      .catch(() => {
        if (active) setBodyParts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm(Array.from(selected));
    setSelected(new Set());
  }

  function handleSkip() {
    onConfirm([]);
    setSelected(new Set());
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text variant="subheader" style={styles.title}>
            {t('routineExercises.muscleAssign.title', { defaultValue: '¿Qué músculo trabaja?' })}
          </Text>
          <Text variant="caption" tone="secondary" style={styles.subtitle}>
            {exerciseName}
          </Text>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.textPrimary} />
            </View>
          ) : (
            <FlatList
              data={bodyParts}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const isSelected = selected.has(item.name);
                return (
                  <Pressable
                    onPress={() => toggle(item.name)}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                    )}
                    <Text
                      variant="caption"
                      style={isSelected ? styles.chipTextSelected : styles.chipText}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          <View style={styles.actions}>
            <Button variant="outline" size="md" onPress={handleSkip} style={styles.actionButton}>
              {t('routineExercises.muscleAssign.skip', { defaultValue: 'Omitir' })}
            </Button>
            <Button variant="primary" size="md" onPress={handleConfirm} style={styles.actionButton}>
              {t('routineExercises.muscleAssign.confirm', { defaultValue: 'Agregar' })}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    maxHeight: '70%',
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.surfaceAccent,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  loadingWrap: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.textPrimary,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
