import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Pressable } from 'react-native';
import { ActivityIcon } from '../../icons/activityIcon';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';
import type { ActiveChallengeViewModel } from './challengeListSections';

interface CompletedChallengeCardProps {
  challenge: ActiveChallengeViewModel;
  conqueredLabel: string;
  completedLabel: string;
  onPress?: () => void;
}

export function CompletedChallengeCard({
  challenge,
  conqueredLabel,
  completedLabel,
  onPress,
}: CompletedChallengeCardProps) {
  const { activityType, title, progressPercent } = challenge;
  const categoryColor = colors.activityType[activityType];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.86 : 1 }]}
    >
      <View style={[styles.card, { borderColor: `${categoryColor}14` }]}>
        {/* Category halo: diagonal gradient bleeding in from top-left */}
        <LinearGradient
          colors={[`${categoryColor}3D`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.65, y: 0.65 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.content}>
          {/* Icon with soft category-color glow ring */}
          <View style={[styles.iconGlowRing, { backgroundColor: `${categoryColor}26` }]}>
            <ActivityIcon type={activityType} size="md" />
          </View>

          {/* Bottom: eyebrow + title + progress + footer */}
          <View style={styles.bottom}>
            <Stack gap="xs">
              <Text variant="label" style={{ color: categoryColor, letterSpacing: 2 }}>
                {conqueredLabel}
              </Text>
              <Text variant="header" tone="primary" numberOfLines={2}>{title}</Text>

              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[categoryColor, `${categoryColor}99`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>
            </Stack>

            <Row justify="space-between" align="center" style={styles.footer}>
              <Text variant="body" tone="secondary">{`${progressPercent}%`}</Text>
              <Row justify="flex-end" align="center" gap="xs">
                <Icon name="checkmark-circle" size={14} color={categoryColor} />
                <Text variant="body" style={{ color: categoryColor }}>{completedLabel}</Text>
              </Row>
            </Row>
          </View>
        </View>
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
    minHeight: 200,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    minHeight: 198,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  iconGlowRing: {
    padding: 6,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  bottom: {
    gap: spacing.xs,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  footer: {
    marginTop: spacing.xs,
  },
});
