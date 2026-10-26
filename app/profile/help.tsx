import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { Card } from '../../components/ui/card';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

/** Section → question ids; the copy lives in `help.sections.<section>.items.<question>`. */
export const HELP_SECTIONS = {
  challenges: ['join', 'leave', 'finish', 'location'],
  progress: ['log', 'restDay', 'streak', 'badges'],
  privacy: ['photoVisibility', 'privateProfile', 'deleteAccount'],
  posts: ['review', 'report', 'delete', 'suspension'],
} as const;

type HelpSection = keyof typeof HELP_SECTIONS;

function Question({ id, question, answer }: { id: string; question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card
      variant="basic"
      radius="medium"
      onPress={() => setOpen((value) => !value)}
      accessibilityRole="button"
      accessibilityLabel={question}
      accessibilityState={{ expanded: open }}
      testID={`help-${id}`}
    >
      <Row justify="space-between" align="center" gap="sm">
        <Text variant="body" style={styles.question}>
          {question}
        </Text>
        <Icon
          name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={18}
          color={withAlpha(colors.paper, textOpacity.tertiary)}
        />
      </Row>
      {open ? (
        <Text variant="caption" tone="secondary" style={styles.answer} testID={`help-${id}-answer`}>
          {answer}
        </Text>
      ) : null}
    </Card>
  );
}

/**
 * Help / FAQ (Sprint 10, B9): short answers about challenges, progress, privacy
 * and posts. Opened from Settings (like most social apps) so it never interrupts
 * the main flows; each question expands in place.
 */
export default function HelpScreen() {
  const { t } = useTranslation();

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('help.title')}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="caption" tone="secondary">
          {t('help.intro')}
        </Text>
        {(Object.keys(HELP_SECTIONS) as HelpSection[]).map((section) => (
          <View key={section} style={styles.section}>
            <Text variant="caption" tone="secondary" weight="bold" style={styles.sectionTitle}>
              {t(`help.sections.${section}.title`)}
            </Text>
            {HELP_SECTIONS[section].map((item) => (
              <Question
                key={item}
                id={`${section}-${item}`}
                question={t(`help.sections.${section}.items.${item}.q`)}
                answer={t(`help.sections.${section}.items.${item}.a`)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  trailingSpacer: {
    width: 44,
    height: 44,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
  question: {
    flex: 1,
  },
  answer: {
    marginTop: spacing.sm,
  },
});
