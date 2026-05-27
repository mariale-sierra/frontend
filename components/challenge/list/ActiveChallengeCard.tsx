import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIcon } from '../../icons/activityIcon';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { ChallengeProgressBar } from './ChallengeProgressBar';
import { colors, radius, spacing } from '../../../constants/theme';
import type { ActiveChallengeViewModel } from './challengeListSections';

interface ActiveChallengeCardProps {
  challenge: ActiveChallengeViewModel;
  statusLabel: string;
  onPress?: () => void;
  layout?: 'compact' | 'full';
}

type ChallengeStatus = ActiveChallengeViewModel['status'];

const GRADIENT_COLORS: Record<ChallengeStatus, readonly [string, string]> = {
  active: ['#1a1a1c', '#050505'],
  completed: ['#0d0d0d', 'rgba(74, 222, 128, 0.09)'],
  left: ['#141416', '#050505'],
};

type IconName = React.ComponentProps<typeof Icon>['name'];

const FOOTER_ICON: Record<ChallengeStatus, { name: IconName; color: string }> = {
  active: { name: 'flame', color: '' },
  completed: { name: 'checkmark-circle', color: colors.success },
  left: { name: 'pause-circle', color: colors.textSecondary },
};

export function ActiveChallengeCard({
  challenge,
  statusLabel,
  onPress,
  layout = 'compact',
}: ActiveChallengeCardProps) {
  const { status, activityType, isRestDay } = challenge;
  const gradientColors = GRADIENT_COLORS[status];
  const footerIcon = FOOTER_ICON[status];
  const footerIconColor = status !== 'active'
    ? footerIcon.color
    : isRestDay
      ? colors.restDayNeon
      : colors.activityType[activityType];
  const isLeft = status === 'left';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        layout === 'compact' ? styles.compactPressable : styles.fullPressable,
        { opacity: pressed ? 0.86 : 1 },
      ]}
    >
      <View style={[styles.card, layout === 'full' && styles.fullCard]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        >
          {isRestDay && (
            <LinearGradient
              colors={['rgba(155,145,255,0.06)', 'rgba(155,145,255,0.02)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.75, y: 0.75 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          <View style={styles.content}>
            <View style={isLeft ? styles.leftIcon : undefined}>
              {isRestDay ? (
                <View style={styles.restDayMoon}>
                  <Ionicons name="moon" size={22} color={colors.primary} />
                </View>
              ) : (
                <ActivityIcon type={activityType} size="md" />
              )}
            </View>

            <View style={styles.bottom}>
              <Stack gap="xs">
                <Text
                  variant="header"
                  tone="primary"
                  style={isLeft ? styles.leftTitle : undefined}
                  numberOfLines={2}
                >
                  {challenge.title}
                </Text>
                <ChallengeProgressBar progressPercent={challenge.progressPercent} />
              </Stack>

              <Row justify="space-between" align="center" style={styles.footer}>
                <Text variant="body" tone="secondary">{`${challenge.progressPercent}%`}</Text>
                <Row justify="flex-end" align="center" gap="xs">
                  <Icon name={footerIcon.name} size={14} color={footerIconColor} />
                  <Text variant="body" tone="secondary">{statusLabel}</Text>
                </Row>
              </Row>
            </View>
          </View>

          {isLeft && (
            <>
              <View style={styles.hazeOverlay} />
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.04)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </>
          )}
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactPressable: {
    alignSelf: 'flex-start',
  },
  fullPressable: {
    width: '100%',
  },
  card: {
    width: 272,
    minHeight: 210,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  fullCard: {
    width: '100%',
  },
  gradient: {
    width: '100%',
    minHeight: 210,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bottom: {
    gap: spacing.xs,
  },
  footer: {
    marginTop: spacing.xxs,
  },
  hazeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,20,25,0.55)',
  },
  leftIcon: {
    opacity: 0.6,
  },
  leftTitle: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Rest day: bare moon icon with neon glow, no container circle.
  restDayMoon: {
    marginTop: 3,
    shadowColor: colors.restDayNeon,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 10,
  },
});
