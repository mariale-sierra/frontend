import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIcon } from '../../icons/activityIcon';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { Text } from '../../ui/text';
import { ChallengeBadge } from './ChallengeBadge';
import { radius, spacing } from '../../../constants/theme';
import type { ActivityType } from '../../../constants/theme';
import type { ExploreChallengeViewModel } from './challengeListSections';

interface ExploreChallengeCardProps {
  challenge: ExploreChallengeViewModel;
  onPress?: () => void;
}

const ICON_PX = 48; // containerSize['lg']
const SPREAD = 28;  // top-left corner offset between icons; gives ~8 px of circle overlap

function ActivityIconStack({
  primary,
  secondary,
  tertiary,
}: {
  primary: ActivityType;
  secondary?: ActivityType;
  tertiary?: ActivityType;
}) {
  // ">" formation — secondary top-left, tertiary bottom-left, primary center-right
  if (secondary && tertiary) {
    return (
      <View style={{ width: SPREAD + ICON_PX, height: SPREAD * 2 + ICON_PX }}>
        <View style={[styles.iconSlot, { top: 0, left: 0, zIndex: 1, opacity: 0.78 }]}>
          <ActivityIcon type={secondary} size="lg" glow />
        </View>
        <View style={[styles.iconSlot, { top: SPREAD * 2, left: 0, zIndex: 1, opacity: 0.78 }]}>
          <ActivityIcon type={tertiary} size="lg" glow />
        </View>
        {/* rendered last so it sits on top on both iOS and Android */}
        <View style={[styles.iconSlot, { top: SPREAD, left: SPREAD, zIndex: 3 }]}>
          <ActivityIcon type={primary} size="lg" glow />
        </View>
      </View>
    );
  }

  // "/" formation — secondary bottom-left, primary top-right
  if (secondary) {
    const size = SPREAD + ICON_PX;
    return (
      <View style={{ width: size, height: size }}>
        <View style={[styles.iconSlot, { top: SPREAD, left: 0, zIndex: 1, opacity: 0.78 }]}>
          <ActivityIcon type={secondary} size="lg" glow />
        </View>
        <View style={[styles.iconSlot, { top: 0, left: SPREAD, zIndex: 3 }]}>
          <ActivityIcon type={primary} size="lg" glow />
        </View>
      </View>
    );
  }

  // Single icon
  return <ActivityIcon type={primary} size="lg" glow />;
}

export function ExploreChallengeCard({ challenge, onPress }: ExploreChallengeCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <View style={styles.card}>
        <LinearGradient
          colors={['#0a0a0a', '#242323']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          <Row justify="space-between" align="stretch" gap="md" style={styles.content}>
            <Stack style={styles.textAndBadges} justify="space-between">
              <Stack gap="xs">
                <Text variant="header" tone="primary" numberOfLines={1}>
                  {challenge.title}
                </Text>
                <Text variant="body" tone="secondary" numberOfLines={1}>
                  {challenge.subtitle}
                </Text>
              </Stack>

              <Row justify="flex-start" align="center" gap="sm" style={styles.badgesRow}>
                <ChallengeBadge label={challenge.durationLabel} />
                <ChallengeBadge label={challenge.locationLabel} />
              </Row>
            </Stack>

            <View style={styles.iconWrapper}>
              <ActivityIconStack
                primary={challenge.activityType}
                secondary={challenge.secondaryActivityType}
                tertiary={challenge.tertiaryActivityType}
              />
            </View>
          </Row>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    width: '100%',
    minHeight: 130,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gradient: {
    flex: 1,
    padding: spacing.lg,
  },
  content: {
    flex: 1,
  },
  textAndBadges: {
    flex: 1,
    minWidth: 0,
  },
  badgesRow: {
    flexWrap: 'wrap',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSlot: {
    position: 'absolute',
  },
  pressed: {
    opacity: 0.86,
  },
});
