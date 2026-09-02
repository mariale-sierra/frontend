import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { FormField } from '../ui/formField';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { formatCount } from '../../utils/format';
import { getExerciseCategories } from '../../services/exercises/exercises.service';
import type { ExerciseCategory } from '../../services/exercises/exercises.service';
import { activityColors } from '../../constants/theme';
import { findCategoryForActivityType } from '../../services/adapters/spaceAdapter';
import type { ActivityType } from '../../types/activity';
import type { CreateSpacePayload, SpaceVisibility } from '../../types/space';

const ACTIVITY_TYPES: ActivityType[] = [
  'strength',
  'cardioIntense',
  'cardioLow',
  'functional',
  'flexibility',
  'mindBody',
];

export interface SpaceFormValues {
  name: string;
  description: string;
  visibility: SpaceVisibility;
  activityType: ActivityType | null;
}

interface SpaceFormProps {
  initialValues?: Partial<SpaceFormValues>;
  /** Shown in the live preview's member row — the space's real count when
   * editing, or omitted (defaults to 1, the owner) when creating. */
  previewMembersCount?: number;
  submitLabel: string;
  submitting?: boolean;
  submitError?: string | null;
  onSubmit: (payload: CreateSpacePayload) => void;
}

/**
 * Shared "Manage space" form — wireframe Chats-47C is explicitly the SAME
 * screen for both creating and editing a space, so this component holds only
 * the fields themselves; `app/messaging/spaces/create.tsx` and
 * `[id]/manage.tsx` each wrap it with their own header/members/delete rows.
 */
export function SpaceForm({
  initialValues,
  previewMembersCount,
  submitLabel,
  submitting = false,
  submitError,
  onSubmit,
}: SpaceFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [visibility, setVisibility] = useState<SpaceVisibility>(initialValues?.visibility ?? 'public');
  const [activityType, setActivityType] = useState<ActivityType | null>(
    initialValues?.activityType ?? null,
  );
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    getExerciseCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const selectedCategory = useMemo(
    () => (activityType ? findCategoryForActivityType(categories, activityType) : null),
    [categories, activityType],
  );
  const accentColor = activityType ? activityColors[activityType] : colors.primary;

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t('spaces.nameRequiredError'));
      return;
    }
    setNameError(null);
    onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
      visibility,
      activityCategoryId: selectedCategory?.id,
    });
  }

  return (
    <View style={styles.container}>
      <FormField
        label={t('spaces.nameLabel')}
        placeholder={t('spaces.namePlaceholder')}
        value={name}
        onChangeText={setName}
        maxLength={150}
        error={nameError}
      />

      <View>
        <Row justify="space-between" align="center" style={styles.descriptionHeader}>
          <Text variant="subheader">{t('spaces.descriptionLabel')}</Text>
          <Text variant="caption" tone="secondary">
            {t('spaces.descriptionOptional')}
          </Text>
        </Row>
        <FormField
          placeholder={t('spaces.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={1000}
        />
      </View>

      <View>
        <Row justify="space-between" align="center">
          <Text variant="header" tone="secondary">
            {t('spaces.activityColorLabel')}
          </Text>
          <Text variant="caption" tone="secondary">
            {t('spaces.activityColorHint')}
          </Text>
        </Row>
        <View style={styles.swatchGrid}>
          {ACTIVITY_TYPES.map((type) => {
            const selected = activityType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setActivityType(type)}
                style={styles.swatchWrap}
                accessibilityLabel={t(`challenges.categories.${type}`, { defaultValue: type })}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: activityColors[type] },
                    selected && styles.swatchSelected,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
        {activityType && (
          <Text variant="caption" tone="secondary" style={styles.selectedCaption}>
            {t('spaces.activityColorSelected', {
              name: selectedCategory?.name ?? activityType,
            })}
          </Text>
        )}
      </View>

      <View>
        <Text variant="header" tone="secondary">
          {t('spaces.previewLabel')}
        </Text>
        <View style={[stylesPreview.card, { borderLeftColor: accentColor }]}>
          {selectedCategory && (
            <View style={[stylesPreview.badge, { backgroundColor: accentColor }]}>
              <Text variant="caption" weight="bold" style={stylesPreview.badgeText}>
                {selectedCategory.name}
              </Text>
            </View>
          )}
          <Text variant="body" size="lg" weight="bold" numberOfLines={1}>
            {name.trim() || t('spaces.namePlaceholder')}
          </Text>
          {description.trim() ? (
            <Text variant="body" tone="secondary" numberOfLines={2}>
              {description.trim()}
            </Text>
          ) : null}
          <Row gap="xs" justify="flex-start">
            <Icon name="people-outline" size={16} color={colors.paper} />
            <Text variant="caption" tone="secondary">
              {t('spaces.membersCount', { count: formatCount(previewMembersCount ?? 1) })}
            </Text>
          </Row>
        </View>
      </View>

      <View>
        <Text variant="header" tone="secondary" style={styles.visibilityLabel}>
          {t('spaces.visibilityLabel')}
        </Text>
        {(['public', 'private'] as SpaceVisibility[]).map((option) => {
          const selected = visibility === option;
          return (
            <Pressable
              key={option}
              onPress={() => setVisibility(option)}
              style={[styles.visibilityCard, selected && styles.visibilityCardSelected]}
            >
              <Icon
                name={option === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                size={22}
                color={selected ? colors.primary : colors.paper}
              />
              <View style={styles.visibilityTextBlock}>
                <Text variant="body" weight="bold">
                  {t(`spaces.visibility${option === 'public' ? 'Public' : 'Private'}Title`)}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t(`spaces.visibility${option === 'public' ? 'Public' : 'Private'}Description`)}
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

      {submitError ? (
        <Text variant="caption" style={styles.submitError}>
          {submitError}
        </Text>
      ) : null}

      <Button onPress={handleSubmit} loading={submitting} style={styles.submitButton}>
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  descriptionHeader: {
    marginBottom: spacing.xs,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  swatchWrap: {
    width: 56,
    alignItems: 'center',
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: radius.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.paper,
  },
  selectedCaption: {
    marginTop: spacing.sm,
  },
  visibilityLabel: {
    marginBottom: spacing.md,
  },
  visibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  visibilityCardSelected: {
    borderColor: colors.primary,
  },
  visibilityTextBlock: {
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
  submitError: {
    color: colors.error,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});

const stylesPreview = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.big,
    borderLeftWidth: 4,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.ink,
    opacity: 1,
  },
});
