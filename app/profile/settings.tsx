import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { SettingsRow } from '../../components/profile/SettingsRow';
import { LogoutButton } from '../../components/profile/LogoutButton';
import { DeleteAccountRow } from '../../components/profile/DeleteAccountRow';
import { spacing } from '../../constants/theme';
import type { LegalDocKey } from '../../constants/legal/legalDocs';

const LEGAL_DOCS: Array<{ doc: LegalDocKey; icon: 'document-text-outline' | 'shield-checkmark-outline' | 'people-outline' }> = [
  { doc: 'terms', icon: 'document-text-outline' },
  { doc: 'privacy', icon: 'shield-checkmark-outline' },
  { doc: 'community', icon: 'people-outline' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="caption" tone="secondary" weight="bold" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * Settings (Sprint 10, B2): Neurolab participants looked for settings and log
 * out behind the profile's pencil, which only opened Edit profile. The profile
 * now has a gear that opens this screen, which groups what was scattered:
 * edit profile, notifications, the legal documents, about, log out and delete
 * account. Each row opens the screen that already existed (same confirmations).
 * Help / FAQ (B9) is one more row in the "legal and information" section.
 */
export default function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('settings.title')}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title={t('settings.sections.account')}>
          <SettingsRow
            icon="person-circle-outline"
            label={t('profile.editButton')}
            hint={t('settings.editProfileHint')}
            onPress={() => router.push('/profile/edit')}
            testID="settings-edit-profile"
          />
        </Section>

        <Section title={t('settings.sections.preferences')}>
          <SettingsRow
            icon="notifications-outline"
            label={t('settings.notifications')}
            hint={t('settings.notificationsHint')}
            onPress={() => router.push('/notification-settings')}
            testID="settings-notifications"
          />
        </Section>

        <Section title={t('settings.sections.legal')}>
          <SettingsRow
            icon="help-circle-outline"
            label={t('help.title')}
            hint={t('settings.helpHint')}
            onPress={() => router.push('/profile/help')}
            testID="settings-help"
          />
          {LEGAL_DOCS.map(({ doc, icon }) => (
            <SettingsRow
              key={doc}
              icon={icon}
              label={t(`legal.docs.${doc}`)}
              onPress={() => router.push({ pathname: '/(auth)/legal', params: { doc } })}
              testID={`settings-legal-${doc}`}
            />
          ))}
          <SettingsRow
            icon="information-circle-outline"
            label={t('about.title')}
            hint={t('settings.aboutHint')}
            onPress={() => router.push('/profile/about')}
            testID="settings-about"
          />
        </Section>

        <Section title={t('settings.sections.session')}>
          <LogoutButton />
          <DeleteAccountRow />
        </Section>
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
});
