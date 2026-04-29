import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenShell } from '../../components/auth/auth-screen-shell';
import { AuthSwitchRow } from '../../components/auth/auth-switch-row';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Input } from '../../components/ui/input';
import { Loader } from '../../components/ui/loader';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthScreenShell
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <AuthSwitchRow
          prompt={t('auth.register.switchPrompt')}
          actionLabel={t('auth.register.switchAction')}
          onPress={() => router.push('/login')}
        />
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
        placeholder={t('common.fields.username')}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        variant="filled"
        leftIcon={<Icon name="person-outline" size={18} color={colors.textSecondary} />}
      />

      <Input
        placeholder={t('common.fields.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        variant="filled"
        leftIcon={<Icon name="lock-closed-outline" size={18} color={colors.textSecondary} />}
      />

      <Button size="md" onPress={async () => {
        setIsLoading(true);
        try {
          console.log('Email:', email);
          console.log('Username:', username);
          console.log('BaseURL:', api.defaults.baseURL);
          const result = await register(email, username, password);
          console.log('Resultado:', JSON.stringify(result));
        } catch (error: any) {
          console.log('Error status:', error?.response?.status);
          console.log('Error data:', error?.response?.data);
          console.log('Error message:', error?.message);
          Alert.alert(
            t('common.errors.genericTitle'),
            error?.response?.data?.message || t('auth.register.createAccountFailed'),
          );
        } finally {
          setIsLoading(false);
        }
      }}>
        {t('common.actions.register')}
      </Button>

      <Loader visible={isLoading} />
    </AuthScreenShell>
  );
}
