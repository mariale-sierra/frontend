import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../components/layout/screenBackground';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { LegalConsent, type LegalConsentValue } from '../components/legal/LegalConsent';
import { acceptTerms } from '../services/auth/auth.service';
import { useAuth } from '../hooks/useAuth';
import { useErrorNotificationStore } from '../store/errorNotificationStore';
import { spacing } from '../constants/theme';

/**
 * Shown once to signed-in users whose account has no (or an outdated)
 * acceptance of the Terms / Privacy Policy. RootNavigator sends them here;
 * the app is unusable until they accept (or sign out).
 */
export default function AcceptTermsScreen() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { show } = useErrorNotificationStore();
  const [consent, setConsent] = useState<LegalConsentValue>({
    acceptTerms: false,
    confirmAge16: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const ready = consent.acceptTerms && consent.confirmAge16;

  async function handleAccept() {
    if (!ready) return;
    setSubmitting(true);
    try {
      await acceptTerms(consent);
      router.replace('/(tabs)');
    } catch (error: any) {
      show({ message: error?.response?.data?.message || t('legal.accept.failed') });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenBackground variant="top">
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">{t('legal.accept.title')}</Text>
        <Text variant="body" tone="secondary">
          {t('legal.accept.subtitle')}
        </Text>
        <LegalConsent value={consent} onChange={setConsent} />
        <Button
          variant="primary"
          size="md"
          onPress={handleAccept}
          loading={submitting}
          disabled={!ready}
          style={styles.button}
        >
          {t('legal.accept.cta')}
        </Button>
        <Button variant="neutral" size="md" onPress={() => logout()}>
          {t('profile.logoutButton')}
        </Button>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
});
