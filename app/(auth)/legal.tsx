import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { colors, spacing } from '../../constants/theme';
import { LEGAL_DOCS, LEGAL_VERSION, type LegalDocKey } from '../../constants/legal/legalDocs';

function isLegalDocKey(value: unknown): value is LegalDocKey {
  return value === 'terms' || value === 'privacy' || value === 'community';
}

/**
 * Read-only viewer for the legal documents (?doc=terms|privacy|community).
 * Lives inside "(auth)" so it works before login (register step), and the
 * RootNavigator guard explicitly lets signed-in users reach it too.
 */
export default function LegalScreen() {
  const { t } = useTranslation();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const key: LegalDocKey = isLegalDocKey(doc) ? doc : 'terms';
  const content = LEGAL_DOCS[key];

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {content.title}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="caption" tone="secondary">
          {t('legal.version', { version: LEGAL_VERSION })}
        </Text>
        {content.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text variant="subheader">{section.heading}</Text>
            {section.paragraphs?.map((p) => (
              <Text key={p} variant="body" tone="secondary">
                {p}
              </Text>
            ))}
            {section.bullets?.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <Text variant="body" tone="secondary">
                  {'•'}
                </Text>
                <Text variant="body" tone="secondary" style={styles.bulletText}>
                  {b}
                </Text>
              </View>
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
  backButton: { marginLeft: -spacing.sm },
  headerTitle: { flex: 1 },
  trailingSpacer: { width: 44, height: 44 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  section: { gap: spacing.sm },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bulletText: { flex: 1, color: colors.paper },
});
