import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthScreenShell } from '../../components/auth/auth-screen-shell';
import { AuthSwitchRow } from '../../components/auth/auth-switch-row';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Loader } from '../../components/ui/loader';
import { ControlledAuthField } from '../../components/form/ControlledAuthField';
import { useAuth } from '../../hooks/useAuth';
import { colors, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useTranslation } from 'react-i18next';
import { createRegisterSchema, type RegisterFormValues } from '../../validation/authSchemas';

const iconColor = withAlpha(colors.paper, textOpacity.secondary);

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(() => createRegisterSchema(t), [t]);
  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', username: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, username, password }) => {
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
  });

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
      <ControlledAuthField
        control={control}
        name="email"
        placeholder={t('common.fields.email')}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        leftIcon={<Icon name="mail-outline" size={18} color={iconColor} />}
      />

      <ControlledAuthField
        control={control}
        name="username"
        placeholder={t('common.fields.username')}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        leftIcon={<Icon name="person-outline" size={18} color={iconColor} />}
      />

      <ControlledAuthField
        control={control}
        name="password"
        placeholder={t('common.fields.password')}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        leftIcon={<Icon name="lock-closed-outline" size={18} color={iconColor} />}
      />

      <Button size="md" onPress={onSubmit}>
        {t('common.actions.register')}
      </Button>

      <Loader visible={isLoading} />
    </AuthScreenShell>
  );
}
