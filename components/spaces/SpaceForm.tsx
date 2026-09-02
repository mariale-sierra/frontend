import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
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

export interface SpaceFormHandle {
  /** Runs the same validation + submit flow the old internal Button used to
   * trigger — called by the wrapping screen's own sticky footer Button. */
  submit: () => void;
}

interface SpaceFormProps {
  initialValues?: Partial<SpaceFormValues>;
  /** Shown in the live preview's member row — the space's real count when
   * editing, or omitted (defaults to 1, the owner) when creating. */
  previewMembersCount?: number;
  /** Fires whenever the chosen activity color changes (including back to the
   * neutral default when cleared) — the wrapping screen's sticky footer
   * Button uses this to color itself the same way the Privacy section's
   * selected-card outline does, since that Button lives outside this
   * component and can't read `accentColor` directly. */
  onAccentColorChange?: (color: string) => void;
  onSubmit: (payload: CreateSpacePayload) => void;
}

/**
 * Shared "Manage space" form — wireframe Chats-47C is explicitly the SAME
 * screen for both creating and editing a space, so this component holds only
 * the fields themselves; `app/messaging/spaces/create.tsx` and
 * `[id]/manage.tsx` each wrap it with their own header/members/delete rows.
 *
 * The submit Button itself is NOT rendered here — per the wireframe, "Save"
 * stays pinned to the bottom of the screen while the fields above it scroll,
 * which requires the Button to live outside the ScrollView as a sibling
 * footer. This component exposes `submit()` via `ref` so the wrapping
 * screen's own footer Button can trigger the same validation/payload-build
 * flow that used to run on an internal Button press. A submit error message
 * used to render here too, at the end of this scrollable content — moved
 * out to the wrapping screen's own footer instead (always visible, next to
 * the Button itself) after a real, reported "nothing happens on Save"
 * confusion: the message WAS rendering correctly, just below the Privacy
 * section, easy to never scroll down far enough to see if you tapped Save
 * while still up at the Activity Color section.
 */
export const SpaceForm = forwardRef<SpaceFormHandle, SpaceFormProps>(function SpaceForm(
  { initialValues, previewMembersCount, onAccentColorChange, onSubmit },
  ref,
) {
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

  useEffect(() => {
    onAccentColorChange?.(accentColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accentColor]);

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t('spaces.nameRequiredError'));
      return;
    }
    setNameError(null);

    // Real, reported bug: `categories` loads asynchronously on mount
    // (GET /exercises/categories) — a user who picks a color swatch and
    // hits submit quickly (a completely normal interaction speed) can beat
    // that request, so `selectedCategory` is silently still null even
    // though `activityType` IS chosen. The space then gets created with NO
    // category at all — no error, nothing to notice, the color just
    // "doesn't stick." If that's the situation here, resolve the category
    // fresh right now instead of trusting whatever `categories` happened to
    // hold by the time the user tapped submit.
    let activityCategoryId = selectedCategory?.id;
    if (activityType && !activityCategoryId) {
      try {
        const freshCategories = await getExerciseCategories();
        activityCategoryId = findCategoryForActivityType(freshCategories, activityType)?.id;
      } catch {
        // Falls through with activityCategoryId still unresolved — better
        // to create the space without its color than to block submission
        // entirely over this one field.
      }
    }

    onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
      visibility,
      activityCategoryId,
    });
  }

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <View style={styles.container}>
      <FormField
        label={t('spaces.nameLabel')}
        labelVariant="header"
        placeholder={t('spaces.namePlaceholder')}
        placeholderVariant="caption"
        value={name}
        onChangeText={setName}
        maxLength={150}
        error={nameError}
      />

      <View>
        <Row justify="space-between" align="center" style={styles.descriptionHeader}>
          <Text variant="header" tone="secondary">{t('spaces.descriptionLabel')}</Text>
          <Text variant="caption" tone="secondary">
            {t('spaces.descriptionOptional')}
          </Text>
        </Row>
        <FormField
          placeholder={t('spaces.descriptionPlaceholder')}
          placeholderVariant="caption"
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
            const label = t(`challenges.categories.${type}`, { defaultValue: type });
            return (
              <Pressable
                key={type}
                onPress={() => setActivityType(type)}
                style={styles.swatchWrap}
                accessibilityLabel={label}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: activityColors[type] },
                    selected && styles.swatchSelected,
                  ]}
                />
                <Text
                  variant="caption"
                  tone={selected ? undefined : 'secondary'}
                  weight={selected ? 'bold' : undefined}
                  numberOfLines={1}
                  style={styles.swatchLabel}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="caption" tone="secondary" style={styles.selectedCaption}>
          {activityType
            ? t('spaces.activityColorSelected', { name: selectedCategory?.name ?? activityType })
            : t('spaces.activityColorNotSelected')}
        </Text>
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
              {t('spaces.membersCount', {
                count: previewMembersCount ?? 1,
                formattedCount: formatCount(previewMembersCount ?? 1),
              })}
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
              style={[styles.visibilityCard, selected && { borderColor: accentColor }]}
            >
              <Icon
                name={option === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                size={22}
                color={selected ? accentColor : colors.paper}
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
                <View style={[styles.checkFilled, { backgroundColor: accentColor }]}>
                  <Icon name="checkmark-outline" size={14} color={colors.ink} />
                </View>
              ) : (
                <View style={styles.checkEmpty} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

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
  // 4-column responsive grid (wireframe's `grid-template-columns: repeat(4,
  // 1fr)`) instead of a fixed pixel width — each item claims a quarter of
  // the row (minus the row's own gaps). `flexGrow` must stay 0: with wrap,
  // a leftover item on a partial last row would otherwise stretch to fill
  // the whole remaining line width, and with `aspectRatio: 1` on the swatch
  // that turned into a genuinely huge square — a real bug this surfaced.
  swatchWrap: {
    flexBasis: '22%',
    flexGrow: 0,
    alignItems: 'center',
    gap: spacing.xs,
  },
  swatch: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.paper,
  },
  swatchLabel: {
    textAlign: 'center',
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
  visibilityTextBlock: {
    flex: 1,
    gap: 2,
  },
  // backgroundColor applied inline (accentColor) — only rendered when
  // `selected`, so there's no unselected/static fallback to hold here.
  checkFilled: {
    width: 22,
    height: 22,
    borderRadius: radius.big,
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
