import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { Input } from '../../ui/input';
import { Text } from '../../ui/text';
import { colors, radius, spacing, typography } from '../../../constants/theme';

const NAME_MAX_LENGTH = 40;

export interface ChallengeNameFieldsProps {
  title: string;
  description: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
}

export function ChallengeNameFields({ title, description, onChangeTitle, onChangeDescription }: ChallengeNameFieldsProps) {
  const { t } = useTranslation();
  const [nameFocused, setNameFocused] = useState(false);

  return (
    <Stack gap="2xl">
      <Stack gap="sm">
        <Row justify="space-between" align="flex-end">
          <Text variant="header" tone="secondary">{t('challengeCreate.fields.challengeName')}</Text>
          <Text variant="caption" tone="secondary">{`${title.length} / ${NAME_MAX_LENGTH}`}</Text>
        </Row>

        <Input
          value={title}
          onChangeText={(value) => onChangeTitle(value.slice(0, NAME_MAX_LENGTH))}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          variant="filled"
          placeholder={t('challengeCreate.fields.namePlaceholder')}
          placeholderVariant="caption"
          containerStyle={[styles.nameContainer, nameFocused && styles.nameContainerFocused]}
          style={styles.nameInput}
        />
      </Stack>

      <Stack gap="sm">
        <Row justify="space-between" align="flex-end">
          <Text variant="header" tone="secondary">{t('challengeCreate.fields.description')}</Text>
          <Text variant="caption" tone="secondary">{t('challengeCreate.fields.optional')}</Text>
        </Row>

        <Input
          value={description}
          onChangeText={onChangeDescription}
          variant="filled"
          multiline
          placeholder={t('challengeCreate.fields.descriptionPlaceholder')}
          placeholderVariant="caption"
          containerStyle={styles.descriptionContainer}
          style={styles.descriptionInput}
        />
      </Stack>
    </Stack>
  );
}

const styles = StyleSheet.create({
  nameContainer: {
    borderRadius: radius.medium,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  nameContainerFocused: {
    borderColor: colors.primary,
  },
  nameInput: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionContainer: {
    minHeight: 96,
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  descriptionInput: {
    minHeight: 64,
  },
});
