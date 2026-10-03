import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { Button } from '../../components/ui/button';
import { ConfirmationPopup } from '../../components/ui/confirmationPopup';
import { Text } from '../../components/ui/text';
import { FloatingLabelInput } from '../../components/auth/FloatingLabelInput';
import {
  cancelAccountDeletion,
  getAccountDeletionStatus,
  requestAccountDeletion,
  type AccountDeletionStatus,
} from '../../services/user/accountDeletion.service';
import { useAuth } from '../../hooks/useAuth';
import { colors, radius, spacing } from '../../constants/theme';

const CONSEQUENCES = ['posts', 'metrics', 'messages', 'social', 'irreversible'] as const;

/**
 * Account deletion (backend: /users/me/deletion-request). The user confirms
 * with their password; the account is scheduled for deletion in 30 days and
 * stays recoverable until then. While a request is pending this screen shows
 * the date and a cancel button instead of the form.
 */
export default function DeleteAccountScreen() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const [status, setStatus] = useState<AccountDeletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await getAccountDeletionStatus());
    } catch {
      setStatus({ pending: false, deletion_requested_at: null, deletion_scheduled_for: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleRequest() {
    setConfirmVisible(false);
    setBusy(true);
    setErrorMessage(null);
    try {
      await requestAccountDeletion(password);
      setPassword('');
      await loadStatus();
    } catch (error: any) {
      const code = error?.response?.status;
      setErrorMessage(
        code === 401
          ? t('deleteAccount.wrongPassword')
          : code === 409
            ? t('deleteAccount.alreadyRequested')
            : t('deleteAccount.failed'),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setErrorMessage(null);
    try {
      await cancelAccountDeletion();
      await loadStatus();
    } catch {
      setErrorMessage(t('deleteAccount.cancelFailed'));
    } finally {
      setBusy(false);
    }
  }

  const scheduledDate = status?.deletion_scheduled_for
    ? new Date(status.deletion_scheduled_for).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('deleteAccount.title')}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? null : status?.pending ? (
          <>
            <View style={styles.card}>
              <Text variant="subheader">{t('deleteAccount.pendingTitle')}</Text>
              <Text variant="body" tone="secondary">
                {t('deleteAccount.pendingBody', { date: scheduledDate })}
              </Text>
            </View>
            {errorMessage && (
              <Text variant="caption" style={styles.error}>
                {errorMessage}
              </Text>
            )}
            <Button variant="primary" size="md" onPress={handleCancel} loading={busy}>
              {t('deleteAccount.cancelCta')}
            </Button>
            <Button variant="neutral" size="md" onPress={() => logout()}>
              {t('profile.logoutButton')}
            </Button>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text variant="subheader">{t('deleteAccount.whatHappens')}</Text>
              {CONSEQUENCES.map((key) => (
                <View key={key} style={styles.bulletRow}>
                  <Text variant="body" tone="secondary">
                    {'•'}
                  </Text>
                  <Text variant="body" tone="secondary" style={styles.bulletText}>
                    {t(`deleteAccount.consequence.${key}`)}
                  </Text>
                </View>
              ))}
              <Text variant="body">{t('deleteAccount.gracePeriod')}</Text>
            </View>

            <FloatingLabelInput
              label={t('deleteAccount.passwordLabel')}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setErrorMessage(null);
              }}
              error={Boolean(errorMessage)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
            />
            {errorMessage && (
              <Text variant="caption" style={styles.error}>
                {errorMessage}
              </Text>
            )}

            <Button
              variant="danger"
              size="md"
              onPress={() => setConfirmVisible(true)}
              disabled={password.length === 0 || busy}
              loading={busy}
            >
              {t('deleteAccount.requestCta')}
            </Button>
          </>
        )}
      </ScrollView>

      <ConfirmationPopup
        visible={confirmVisible}
        title={t('deleteAccount.confirmTitle')}
        description={t('deleteAccount.confirmMessage')}
        primaryButton={{ label: t('deleteAccount.confirmCta'), variant: 'danger', onPress: handleRequest }}
        secondaryButton={{ label: t('common.actions.back'), onPress: () => setConfirmVisible(false) }}
        onDismiss={() => setConfirmVisible(false)}
      />
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
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.base,
    gap: spacing.sm,
  },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bulletText: { flex: 1 },
  error: { color: colors.error },
});
