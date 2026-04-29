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
import { colors } from '../../constants/theme';
import api from '../../services/api';
import { login } from '../../services/auth/auth.service';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state

  return (
    <AuthScreenShell
      title="Havit"
      subtitle="Welcome back"
      footer={
        <Stack align="center" gap="sm">
          <AuthSwitchRow
            prompt="Don't have an account?"
            actionLabel="Register"
            onPress={() => router.push('/register')}
          />

          <Pressable onPress={() => router.replace('/(tabs)')}>
            <Text variant="caption" style={styles.guestLinkText}>
              Continue as guest
            </Text>
          </Pressable>
        </Stack>
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
        placeholder="Password"
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
          router.replace('/(tabs)');
        } catch (error: any) {
          console.log('Error status:', error?.response?.status);
          console.log('Error data:', error?.response?.data);
          console.log('Error message:', error?.message);
          Alert.alert('Error', error?.response?.data?.message || 'Invalid email or password');
        } finally {
          setIsLoading(false); // Hide loading spinner
        }
      }}>
        Log in
      </Button>

      <Loader visible={isLoading} />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  guestLinkText: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});