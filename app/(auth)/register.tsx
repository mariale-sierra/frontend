import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenShell } from '../../components/auth/auth-screen-shell';
import { AuthSwitchRow } from '../../components/auth/auth-switch-row';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Input } from '../../components/ui/input';
import { Loader } from '../../components/ui/loader';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import { register } from '../../services/auth.service';

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthScreenShell
      title="Create an account"
      subtitle="Start your first challenge"
      footer={
        <AuthSwitchRow
          prompt="Already have an account?"
          actionLabel="Log in"
          onPress={() => router.push('/login')}
        />
      }
    >
      <Input
        placeholder="Email"
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
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        variant="filled"
        leftIcon={<Icon name="person-outline" size={18} color={colors.textSecondary} />}
      />

      <Input
        placeholder="Password"
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
          router.replace('/(tabs)');
        } catch (error: any) {
          console.log('Error status:', error?.response?.status);
          console.log('Error data:', error?.response?.data);
          console.log('Error message:', error?.message);
          Alert.alert('Error', error?.response?.data?.message || 'Could not create account');
        } finally {
          setIsLoading(false);
        }
      }}>
        Create Account
      </Button>

      <Loader visible={isLoading} />
    </AuthScreenShell>
  );
}
