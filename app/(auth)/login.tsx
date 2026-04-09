import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import ActivityBackground from '../../components/layout/activityBackground';
import { GradientBox } from '../../components/layout/gradient-box';
import { Row } from '../../components/layout/row';
import { Stack } from '../../components/layout/stack';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Input } from '../../components/ui/input';
import { Text } from '../../components/ui/text';
import { colors, radius, spacing } from '../../constants/theme';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ActivityBackground>
      <Stack align="center" justify="center" gap="xl" style={styles.content}>
        <Stack align="center" gap="sm">
          <Text variant="title" align="center">
            Havit
          </Text>
          <Text variant="body" tone="secondary" align="center">
            Welcome back
          </Text>
        </Stack>

        <GradientBox
          colors={[colors.surfaceHighlight, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Stack gap="md" style={styles.cardContent}>
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

            <Button size="md" onPress={() => {}}>
              Log In
            </Button>
          </Stack>
        </GradientBox>

        <Stack align="center" gap="sm">
          <Row justify="center" gap="xs" align="center">
            <Text variant="body" tone="secondary">
              Don&apos;t have an account?
            </Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text variant="body" style={styles.linkText}>
                Register
              </Text>
            </Pressable>
          </Row>

          <Pressable onPress={() => router.replace('/(tabs)')}>
            <Text variant="caption" style={styles.guestLinkText}>
              Continue as guest
            </Text>
          </Pressable>
        </Stack>
      </Stack>
    </ActivityBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.surfaceHighlight,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    padding: spacing.lg,
  },
  linkText: {
    fontWeight: '600',
  },
  guestLinkText: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});