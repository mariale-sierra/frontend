import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { colors, spacing } from '../../../constants/theme';

interface ChallengeAboutSectionProps {
  description: string;
}

const COLLAPSED_LINES = 4;

/** "About" section — collapsed to 4 lines with a "Read more"/"Show less"
 * toggle, same interaction the old ChallengeHeader already had, just
 * restyled (left-aligned, not centered) and given real i18n copy (was
 * hardcoded English before). */
export default function ChallengeAboutSection({ description }: ChallengeAboutSectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!description.trim()) return null;

  return (
    <View style={styles.container}>
      <Text variant="subheader">{t('challengeInfo.aboutTitle')}</Text>
      <Text variant="body" numberOfLines={expanded ? undefined : COLLAPSED_LINES} style={styles.description}>
        {description}
      </Text>
      <Pressable onPress={() => setExpanded((current) => !current)} accessibilityRole="button">
        <Text variant="label" weight="bold" style={styles.toggle}>
          {expanded ? t('challengeInfo.showLess') : t('challengeInfo.readMore')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  description: {
    opacity: 1,
  },
  toggle: {
    color: colors.primary,
    opacity: 1,
  },
});
