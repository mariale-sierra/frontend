import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import type { ChallengeVisibility } from '../../../types/challenge';

interface VisibilityCardGroupProps {
  selectedVisibility: ChallengeVisibility | null;
  onChange: (value: ChallengeVisibility) => void;
}

const OPTIONS: { value: ChallengeVisibility; icon: 'globe-outline' | 'lock-closed-outline' }[] = [
  { value: 'Public', icon: 'globe-outline' },
  { value: 'Private', icon: 'lock-closed-outline' },
];

export function VisibilityCardGroup({ selectedVisibility, onChange }: VisibilityCardGroupProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text variant="header" tone="secondary">{t('challengeCreate.fields.visibility')}</Text>

      {OPTIONS.map((option) => {
        const selected = selectedVisibility === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
          >
            <Icon name={option.icon} size={22} color={selected ? colors.primary : colors.paper} />

            <View style={styles.textBlock}>
              <Text variant="body" weight="bold">
                {t(`challengeCreate.visibility.${option.value.toLowerCase()}Label`)}
              </Text>
              <Text variant="caption" tone="secondary">
                {t(`challengeCreate.visibility.${option.value.toLowerCase()}Description`)}
              </Text>
            </View>

            {selected ? (
              <View style={styles.checkFilled}>
                <Icon name="checkmark-outline" size={14} color={colors.ink} />
              </View>
            ) : (
              <View style={styles.checkEmpty} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: spacing.base,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.9,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  checkFilled: {
    width: 22,
    height: 22,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkEmpty: {
    width: 22,
    height: 22,
    borderRadius: radius.big,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.paper, 0.3),
  },
});
