import { ScrollView, StyleSheet, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Stack } from '../../../components/layout/stack';
import { Divider } from '../../../components/ui/divider';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { DayRoutineHeader, RestDayOptionCard, RoutinePickerCard } from '../../../components/routine';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { colors, spacing, typography } from '../../../constants/theme';
import { useTranslation } from 'react-i18next';

export default function SelectRoutineScreen() {
  const { t } = useTranslation();
  const { day } = useLocalSearchParams<{ day: string }>();
  const { init, savedRoutines, assignRoutineToDay, assignRestDayToDay } = useRoutineBuilder();

  const dayNumber = Number(day ?? '1');

  function handleCreateNew() {
    init(dayNumber);
    router.push(`/challenge/routine/create?day=${dayNumber}`);
  }

  function handleViewRoutine(routineId: string) {
    const routine = savedRoutines.find((item) => item.id === routineId);
    init(dayNumber, routine ?? null);
    router.push(`/challenge/routine/create?day=${dayNumber}`);
  }

  function handleSelectRoutine(routineId: string) {
    const routine = savedRoutines.find((item) => item.id === routineId);
    if (!routine) {
      return;
    }
    assignRoutineToDay(dayNumber, routine);
    router.back();
  }

  function handleSelectRestDay() {
    assignRestDayToDay(dayNumber);
    router.back();
  }

  return (
    <ScreenBackground variant="top">
      <DayRoutineHeader
        title={t('routineSelect.dayRoutineTitle', { day: dayNumber })}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Stack gap="md">
          <RestDayOptionCard onPress={handleSelectRestDay} />

          <Divider variant="section" marginVertical="xs" />

          <Pressable onPress={handleCreateNew} style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}>
            <Text variant="subheader" style={styles.sectionLabel}>{t('routineSelect.yourRoutines')}</Text>
            <View style={styles.addIconButton}>
              <Icon name="add" size={20} color={colors.textPrimary} />
            </View>
          </Pressable>

          {/* Existing Routine Cards */}
          {savedRoutines.map((r) => (
            <RoutinePickerCard
              key={r.id}
              routine={r}
              onPress={() => handleViewRoutine(r.id)}
              onSelect={() => handleSelectRoutine(r.id)}
            />
          ))}
        </Stack>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  sectionLabel: {
    ...typography.title,
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    textTransform: 'none',
  },
  addIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pressed: {
    opacity: 0.82,
  },
});
