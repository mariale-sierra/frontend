import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenShell } from '../../components/auth/auth-screen-shell';
import { AuthSwitchRow } from '../../components/auth/auth-switch-row';
import { AuthInput } from '../../components/auth/auth-input';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Loader } from '../../components/ui/loader';
import { useAuth } from '../../hooks/useAuth';
import { colors, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useTranslation } from 'react-i18next';

const iconColor = withAlpha(colors.paper, textOpacity.secondary);

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
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
        placeholder={t('common.fields.username')}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        leftIcon={<Icon name="person-outline" size={18} color={iconColor} />}
      />

      <AuthInput
        placeholder={t('common.fields.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        leftIcon={<Icon name="lock-closed-outline" size={18} color={iconColor} />}
      />

      <Button size="md" onPress={async () => {
        setIsLoading(true);
        try {
          await register(email, username, password);
        } catch (error: any) {
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
