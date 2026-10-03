import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Stack } from '../../components/layout/stack';
import { AuthScreenBackground } from '../../components/layout/authScreenBackground';
import { FloatingLabelInput } from '../../components/auth/FloatingLabelInput';
import { AuthSwitchRow } from '../../components/auth/auth-switch-row';
import { LanguageSwitch } from '../../components/auth/LanguageSwitch';
import { useAuth } from '../../hooks/useAuth';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { colors, spacing } from '../../constants/theme';
import { createLoginSchema, type LoginFormValues } from '../../validation/authSchemas';

type LoginStepKey = 'email' | 'password';

/**
 * Login, redesigned 2026-09-25. First pass (WelcomeGlowBackground, top-left
 * anchored per-step layout, a progress bar) was a step too far toward
 * register.tsx's OWN specific look — corrected per explicit follow-up:
 * "I do want us to use the original background, I don't want a step
 * progress bar, I want the log in to be centered, and the description too,
 * it has to contain a welcome back message." Back to the original
 * `AuthScreenBackground` (the illustrated image) and a centered
 * title/subtitle/form block — the part of `AuthScreenShell`'s old layout
 * that's kept is exactly that centering; only its `Card` wrapper is gone
 * (per the still-standing "remove the card" request), and the single
 * `Card`+both-fields screen is still split into two steps (email, then
 * password on its own identical-feeling screen) — the actual redesign this
 * was always about, per the original Mobbin reference + "we only do email,
 * let's only do that" (no Google/Apple/Facebook — this app has no OAuth
 * wired up anywhere).
 *
 * `AuthScreenShell`/`ControlledAuthField`/`AuthFormField`/`AuthInput` stay
 * deleted — their only caller (this file) no longer needs the `Card`-based
 * layout they existed for; `AuthScreenBackground` and `login-register.jpg`
 * were restored (`git checkout`) since this screen needs them again.
 */
export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { login } = useAuth();
  const { show } = useErrorNotificationStore();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(() => createLoginSchema(t), [t]);
  const { control, trigger, getValues } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  // Reactive (unlike `getValues`) — the password step's subtitle needs to
  // re-render with whatever was just typed on the email step.
  const emailValue = useWatch({ control, name: 'email' });

  const stepKey: LoginStepKey = step === 0 ? 'email' : 'password';

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  async function handleNext() {
    if (step === 0) {
      const valid = await trigger('email');
      if (!valid) return;
      setStep(1);
      return;
    }

    const valid = await trigger('password');
    if (!valid) return;

    setSubmitting(true);
    try {
      const { email, password } = getValues();
      await login(email, password);
      // No explicit navigation — RootNavigator (app/_layout.tsx) picks up
      // the `isAuthenticated` flip, same as register.tsx.
    } catch (error: any) {
      // Toast, not `Alert.alert` — the same cross-platform reliability fix
      // register.tsx's own account-creation error already got (see that
      // file's history: `Alert.alert` doesn't reliably render on every
      // platform this app ships to).
      show({ message: error?.response?.data?.message || t('auth.login.invalidCredentials') });
    } finally {
      setSubmitting(false);
    }
  }

  const buttonLabel = step === 0 ? t('common.actions.continue') : t('common.actions.login');

  return (
    <AuthScreenBackground>
      <View style={[styles.topRow, { top: insets.top + spacing.md }]} pointerEvents="box-none">
        <LanguageSwitch />
      </View>

      {step > 0 && (
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          style={[styles.backButton, { top: insets.top + spacing.md }]}
        >
          <Icon name="chevron-back-outline" size={24} color={colors.paper} />
        </Pressable>
      )}

      <Stack align="center" justify="center" gap="xl" style={styles.content}>
        <Stack align="center" gap="sm">
          <Text variant="title" align="center">
            {t(`auth.login.step.${stepKey}Title`)}
          </Text>
          <Text variant="body" tone="secondary" align="center">
            {stepKey === 'password'
              ? t('auth.login.step.passwordSubtitle', { email: emailValue })
              : t('auth.login.step.emailSubtitle')}
          </Text>
        </Stack>

        <Stack gap="base" style={styles.form}>
          {stepKey === 'email' ? (
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
                <FloatingLabelInput
                  label={t('common.fields.email')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={Boolean(error)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              )}
            />
          ) : (
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
                <FloatingLabelInput
                  label={t('common.fields.password')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={Boolean(error)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  textContentType="password"
                />
              )}
            />
          )}

          <Button variant="primary" size="md" onPress={handleNext} loading={submitting}>
            {buttonLabel}
          </Button>
        </Stack>

        {step === 0 && (
          <AuthSwitchRow
            prompt={t('auth.login.switchPrompt')}
            actionLabel={t('auth.login.switchAction')}
            onPress={() => router.push('/register')}
          />
        )}
      </Stack>
    </AuthScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  form: {
    width: '100%',
    maxWidth: 420,
  },
  // Full-width overlay, `pointerEvents="box-none"` — the `LanguageSwitch`
  // inside it centers itself via `Row`'s own `justify="center"`, and this
  // wrapper doesn't intercept touches anywhere else in the strip (e.g.
  // `backButton`, a separate sibling near the left edge).
  topRow: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 1,
  },
});
