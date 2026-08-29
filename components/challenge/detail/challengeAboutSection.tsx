import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { spacing } from '../../../constants/theme';

interface ChallengeAboutSectionProps {
  description: string;
  /** Activity Color System v2 — this challenge's own resolved accent color,
   * used for the "Read more"/"Show less" toggle text. */
  accentColor: string;
}

const COLLAPSED_LINES = 4;

/** "About" section — collapsed to 4 lines with a "Read more"/"Show less"
 * toggle, same interaction the old ChallengeHeader already had, just
 * restyled (left-aligned, not centered) and given real i18n copy (was
 * hardcoded English before). */
export default function ChallengeAboutSection({ description, accentColor }: ChallengeAboutSectionProps) {
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
        <Text variant="label" weight="bold" style={[styles.toggle, { color: accentColor }]}>
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
    opacity: 1,
  },
});
