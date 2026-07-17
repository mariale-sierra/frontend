import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { Icon } from '../../ui/icon';
import { ActivityBadge } from '../../ui/activityBadge';
import { LocationIcon, type LocationType } from '../../icons/locationIcon';
import { colors, spacing, type ActivityType } from '../../../constants/theme';
import { useTranslation } from 'react-i18next';

type Props = {
  challenge: {
    label: string;
    description: string;
    locations: LocationType[];
    activityBadges: Array<{ label: string; activityType: ActivityType }>;
  };
  detail: { days: number; membersJoined?: number };
};

export default function ChallengeHeader({ challenge, detail }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const locationLabels: Record<LocationType, string> = {
    home: 'Home',
    gym: 'Gym',
    outdoor: 'Outdoor',
    studio: 'Studio',
    anywhere: 'Anywhere',
  };
  const activityBadgeLabels: Record<ActivityType, string> = {
    strength: t('challenges.activityBadgesShort.strength'),
    cardioIntense: t('challenges.activityBadgesShort.cardioIntense'),
    cardioLow: t('challenges.activityBadgesShort.cardioLow'),
    flexibility: t('challenges.activityBadgesShort.flexibility'),
    mindBody: t('challenges.activityBadgesShort.mindBody'),
    functional: t('challenges.activityBadgesShort.functional'),
  };

  return (
    <View style={styles.container}>
      <View style={styles.joinedRow}>
        <Icon name="people" size={14} color={colors.textPrimary} />
        <Text variant="caption" style={styles.joinedLabel}>
          {detail.membersJoined ?? 0} members joined
        </Text>
      </View>

      <Text variant="title" align="center" style={styles.title}>{challenge.label}</Text>

      <View style={styles.daysRow}>
        <Text style={styles.daysValue}>{detail.days}</Text>
        <Text style={styles.daysUnit}> DAYS</Text>
      </View>

      {challenge.locations.length > 0 && (
        <View style={styles.locationRow}>
          {challenge.locations.map((location, index) => (
            <View key={`${location}-${index}`} style={styles.locationItem}>
              <LocationIcon type={location} size="sm" />
              <Text variant="caption" style={styles.locationLabel}>{locationLabels[location]}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.activityBadgeRow}>
        {challenge.activityBadges.map((item, index) => (
          <ActivityBadge
            key={`${item.activityType}-${index}`}
            label={activityBadgeLabels[item.activityType]}
            activityType={item.activityType}
          />
        ))}
      </View>

      {challenge.description.trim().length > 0 && (
        <View style={styles.descriptionWrap}>
          <Text
            variant="body"
            align="center"
            numberOfLines={expanded ? undefined : 3}
            style={styles.descriptionText}
          >
            {challenge.description}
          </Text>

          <Pressable onPress={() => setExpanded((current) => !current)} style={({ pressed }) => [pressed && styles.pressed]}>
            <Text variant="caption" style={styles.descriptionToggle}>
              {expanded ? 'Show less' : 'Read more'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  joinedLabel: {
    color: colors.textPrimary,
    opacity: 0.86,
  },
  title: {
    maxWidth: '94%',
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  daysValue: {
    color: colors.textPrimary,
    fontSize: 60,
    lineHeight: 62,
    fontWeight: '200',
  },
  daysUnit: {
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  locationItem: {
    alignItems: 'center',
    gap: spacing.xxs,
    minWidth: 45,
  },
  locationLabel: {
    color: colors.textPrimary,
    opacity: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  activityBadgeRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: spacing.xs,
    rowGap: spacing.sm,
    marginTop: spacing.xl,
  },
  descriptionText: {
    maxWidth: '96%',
    lineHeight: 24,
    opacity: 0.80,
    textAlign: 'center',
  },
  descriptionWrap: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  descriptionToggle: {
    color: colors.textPrimary,
    opacity: 0.76,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.84,
  },
});
