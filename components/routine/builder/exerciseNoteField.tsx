import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { colors, spacing } from '../../../constants/theme';

interface ExerciseNoteFieldProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function ExerciseNoteField({ value, onChangeText }: ExerciseNoteFieldProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.noteSection}>
      <Text variant="label">{t('routineCreate.noteLabel')}</Text>
      <TextInput
        style={styles.noteInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={t('routineCreate.notePlaceholder')}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  noteSection: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    minHeight: 40,
  },
});