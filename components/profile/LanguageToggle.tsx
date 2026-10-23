import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';
import type { SupportedLanguage } from '../../i18n';

const LANGUAGES: readonly SupportedLanguage[] = ['en', 'es'];

/**
 * Two-option language switch for Edit profile. Fixed 2026-08-29: this used to
 * be a `Dropdown` (components/ui/dropdown.tsx, used nowhere else) that kept
 * not working across three fix attempts; it was replaced with this plain
 * segmented toggle, the same proven structure `RoutineModeToggle`
 * (components/routine/builder/routineModeToggle.tsx) uses — single string
 * value, one Pressable per option. Presentational only: the screen applies
 * and persists the choice (Sprint 10, B10 — extracted from app/profile/edit.tsx).
 */
export function LanguageToggle({
  value,
  onChange,
}: {
  value: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.toggle}>
      {LANGUAGES.map((code) => {
        const active = value === code;
        return (
          <Pressable
            key={code}
            onPress={() => {
              if (!active) onChange(code);
            }}
            style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.optionPressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            testID={`language-option-${code}`}
          >
            <Text variant="label" weight={active ? 'bold' : 'medium'} inverse={active} tone={active ? 'primary' : 'secondary'}>
              {code === 'en' ? t('profileEdit.languageEn') : t('profileEdit.languageEs')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Same chrome as RoutineModeToggle's proven segmented-toggle pattern:
  // `surface` track, `big` radius, `xs` internal padding/gap.
  toggle: {
    flexDirection: 'row',
    borderRadius: radius.big,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    height: 48,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  optionPressed: {
    opacity: 0.85,
  },
});
