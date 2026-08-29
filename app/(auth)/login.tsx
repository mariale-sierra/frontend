import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenShell } from '../../components/auth/auth-screen-shell';
import { AuthSwitchRow } from '../../components/auth/auth-switch-row';
import { AuthInput } from '../../components/auth/auth-input';
import { Stack } from '../../components/layout/stack';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Loader } from '../../components/ui/loader';
import { Text } from '../../components/ui/text';
import { useAuth } from '../../hooks/useAuth';
import { colors, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useTranslation } from 'react-i18next';

const iconColor = withAlpha(colors.paper, textOpacity.secondary);

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthScreenShell
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <Stack align="center" gap="sm">
          <AuthSwitchRow
            prompt={t('auth.login.switchPrompt')}
            actionLabel={t('auth.login.switchAction')}
            onPress={() => router.push('/register')}
          />

          <Pressable onPress={() => router.replace('/(tabs)')}>
            <Text variant="caption" tone="secondary" style={styles.guestLinkText}>
              {t('common.actions.continueAsGuest')}
            </Text>
          </Pressable>
        </Stack>
      }
    >
      <AuthInput
        placeholder={t('common.fields.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        leftIcon={<Icon name="mail-outline" size={18} color={iconColor} />}
      />

      <AuthInput
        placeholder={t('common.fields.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        leftIcon={<Icon name="lock-closed-outline" size={18} color={iconColor} />}
      />
      <Button size="md" onPress={async () => {
        setIsLoading(true);
        try {
          await login(email, password);
        } catch (error: any) {
          Alert.alert(
            t('common.errors.genericTitle'),
            error?.response?.data?.message || t('auth.login.invalidCredentials'),
          );
        } finally {
          setIsLoading(false);
        }
      }}>
        {t('common.actions.login')}
      </Button>

      <Loader visible={isLoading} />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  guestLinkText: {
    textDecorationLine: 'underline',
  },
});
