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

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ActivityBackground>
      <Stack align="center" justify="center" gap="xl" style={styles.content}>
        <Stack align="center" gap="sm">
          <Text variant="title" align="center">
            Create an account
          </Text>
          <Text variant="body" tone="secondary" align="center">
            Start your first challenge
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

            <Button size="md" onPress={() => {}}>
              Create Account
            </Button>
          </Stack>
        </GradientBox>

        <Row justify="center" gap="xs" align="center">
          <Text variant="body" tone="secondary">
            Already have an account?
          </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text variant="body" style={styles.linkText}>
              Log in
            </Text>
          </Pressable>
        </Row>
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
});