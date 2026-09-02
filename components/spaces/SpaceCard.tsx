import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Row } from '../../components/layout/row';
import { colors, radius, spacing } from '../../constants/theme';
import { formatCount } from '../../utils/format';
import { getSpaceAccentColor, getSpaceMembershipCta } from '../../services/adapters/spaceAdapter';
import type { SpaceContract } from '../../types/space';

interface SpaceCardProps {
  space: SpaceContract;
  onPress: () => void;
  onPressCta: () => void;
  ctaLoading?: boolean;
}

/**
 * Matches wireframe Chats-46A: a colored left accent bar (the space's own
 * Activity Color, see spaceAdapter.getSpaceAccentColor), a category badge
 * pill, the space name/description, a member count row, and a Join/Request
 * to join pill — public spaces get a solid accent-colored "Join" pill,
 * private ones a neutral "Request to join" pill (matches the wireframe's own
 * color distinction between the two example cards).
 */
export function SpaceCard({ space, onPress, onPressCta, ctaLoading = false }: SpaceCardProps) {
  const { t } = useTranslation();
  const accentColor = getSpaceAccentColor(space);
  const cta = getSpaceMembershipCta(space);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={[styles.card, { borderLeftColor: accentColor }]}>
        {/* Real, reported layout bug: the badge and name used to be two
            separate full-width rows (badge+CTA on row 1, name alone on row
            2) — the wireframe groups the badge and name into ONE left-hand
            column that sits in the SAME row as the CTA pill, the CTA
            vertically anchored to that column's top edge, not floating
            above the name on its own line. */}
        <Row align="flex-start" justify="space-between" gap="md">
          <View style={styles.titleColumn}>
            {space.activityCategory && (
              <View style={[styles.badge, { backgroundColor: accentColor }]}>
                <Text variant="caption" weight="bold" style={styles.badgeText}>
                  {space.activityCategory.name}
                </Text>
              </View>
            )}
            {/* Reverted back to `lg` (18px) per explicit follow-up — the
                `xl` bump from the previous request didn't hold. */}
            <Text variant="body" size="lg" weight="bold" numberOfLines={1}>
              {space.name}
            </Text>
          </View>

          {(cta.kind === 'join' || cta.kind === 'request') && (
            <Pressable
              onPress={onPressCta}
              disabled={ctaLoading}
              hitSlop={8}
              style={[
                styles.ctaButton,
                { backgroundColor: cta.kind === 'join' ? accentColor : colors.primary },
                ctaLoading && styles.ctaDisabled,
              ]}
            >
              {ctaLoading ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : (
                <Text variant="label" weight="bold" style={styles.ctaText}>
                  {cta.kind === 'join' ? t('spaces.joinCta') : t('spaces.requestCta')}
                </Text>
              )}
            </Pressable>
          )}
          {cta.kind === 'pending' && (
            <View style={[styles.ctaButton, styles.pendingButton]}>
              <Text variant="label" weight="bold" tone="secondary">
                {t('spaces.pendingCta')}
              </Text>
            </View>
          )}
        </Row>

        {space.description ? (
          // `sm` (14px) — a tier down from `body`'s default `base` (16px),
          // per explicit "description a tad smaller" request.
          <Text variant="body" size="sm" tone="secondary" numberOfLines={2} style={styles.description}>
            {space.description}
          </Text>
        ) : null}

        <Row gap="xs" justify="flex-start" style={styles.membersRow}>
          <Icon name="people-outline" size={16} color={colors.paper} />
          {/* Real, reported bug: `spaces.membersCount` is pluralized
              (`_one`/`_other`), which needs a real NUMBER in `count` to
              resolve at all — `formatCount()` returns a string (e.g.
              "1.2k"), so passing it AS `count` made i18next fail to match
              either variant and fall back to printing the raw key
              ("spaces.membersCount") on screen. `count` stays the real
              number for plural resolution; `formattedCount` is the
              separate interpolation var the strings actually display. */}
          <Text variant="caption" tone="secondary">
            {t('spaces.membersCount', {
              count: space.membersCount,
              formattedCount: formatCount(space.membersCount),
            })}
          </Text>
        </Row>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.big,
    borderLeftWidth: 4,
    padding: spacing.md,
    gap: spacing.xs,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  badge: {
    // Own width, not stretched to the column's full width — matches the
    // wireframe's `align-self: flex-start` on this same badge.
    alignSelf: 'flex-start',
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.ink,
    opacity: 1,
  },
  ctaButton: {
    borderRadius: radius.big,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 32,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: colors.ink,
    opacity: 1,
  },
  pendingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral,
  },
  // Negative `spacing.xs` cancels out `card`'s own `gap: spacing.xs`
  // between its children, purely for this one edge (title-row→description)
  // — description→membersRow keeps the normal card-level gap. Went from a
  // stray un-tokened `marginTop: 2` (previous pass, removed) straight to
  // this because the plain removal reportedly didn't read as smaller —
  // this is a real, larger reduction (down to 0px here), not the same fix
  // repeated.
  description: {
    marginTop: -spacing.xs,
  },
  membersRow: {
    marginTop: spacing.xs,
  },
});
