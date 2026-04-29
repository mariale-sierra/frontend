import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenShell } from '../../components/auth/auth-screen-shell';
import { AuthSwitchRow } from '../../components/auth/auth-switch-row';
import { Stack } from '../../components/layout/stack';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Input } from '../../components/ui/input';
import { Loader } from '../../components/ui/loader';
import { Text } from '../../components/ui/text';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state

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
            <Text variant="caption" style={[styles.guestLinkText, { color: colors.textSecondary }]}>
              {t('common.actions.continueAsGuest')}
            </Text>
          </Pressable>
        </Stack>
      }
    >
      <Input
        placeholder={t('common.fields.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        variant="filled"
        leftIcon={<Icon name="mail-outline" size={18} color={colors.textSecondary} />}
      />

      <Input
        placeholder={t('common.fields.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        variant="filled"
        leftIcon={<Icon name="lock-closed-outline" size={18} color={colors.textSecondary} />}
      />
      <Button size="md" onPress={async () => {
        setIsLoading(true); // Show loading spinner
        try {
          console.log('Email:', email);
          console.log('Password:', password);
          console.log('BaseURL:', api.defaults.baseURL);
          const result = await login(email, password);
          console.log('Resultado:', JSON.stringify(result));
        } catch (error: any) {
          console.log('Error status:', error?.response?.status);
          console.log('Error data:', error?.response?.data);
          console.log('Error message:', error?.message);
          Alert.alert(
            t('common.errors.genericTitle'),
            error?.response?.data?.message || t('auth.login.invalidCredentials'),
          );
        } finally {
          setIsLoading(false); // Hide loading spinner
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

