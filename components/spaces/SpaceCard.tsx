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
        <Row align="flex-start" justify="space-between">
          {space.activityCategory ? (
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
              <Text variant="caption" weight="bold" style={styles.badgeText}>
                {space.activityCategory.name}
              </Text>
            </View>
          ) : (
            <View />
          )}

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

        <Text variant="body" size="lg" weight="bold" numberOfLines={1} style={styles.name}>
          {space.name}
        </Text>

        {space.description ? (
          <Text variant="body" tone="secondary" numberOfLines={2} style={styles.description}>
            {space.description}
          </Text>
        ) : null}

        <Row gap="xs" justify="flex-start" style={styles.membersRow}>
          <Icon name="people-outline" size={16} color={colors.paper} />
          <Text variant="caption" tone="secondary">
            {t('spaces.membersCount', { count: formatCount(space.membersCount) })}
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
  badge: {
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
  name: {
    marginTop: spacing.xs,
  },
  description: {
    marginTop: 2,
  },
  membersRow: {
    marginTop: spacing.xs,
  },
});
