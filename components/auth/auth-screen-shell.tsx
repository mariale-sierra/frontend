import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { AuthScreenBackground } from '../layout/authScreenBackground';
import { Stack } from '../layout/stack';
import { Card } from '../ui/card';
import { Text } from '../ui/text';
import { colors, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Shared shell for login/register — the illustrated background sits behind
 * a solid `surface` card with a hairline border + `shadows.lg` for real
 * definition against a busy image (the same "surface + paper@8% border"
 * combo used for other elevated containers, e.g. Routine Select's empty
 * state) — a flat, borderless, shadowless card was reading as un-elevated
 * content rather than an actual component. */
export function AuthScreenShell({ title, subtitle, children, footer }: AuthScreenShellProps) {
  return (
    <AuthScreenBackground>
      <Stack align="center" justify="center" gap="xl" style={styles.content}>
        <Stack align="center" gap="sm">
          <Text variant="title" align="center">
            {title}
          </Text>
          <Text variant="body" tone="secondary" align="center">
            {subtitle}
          </Text>
        </Stack>

        <Card variant="basic" radius="big" padding="lg" style={styles.card}>
          <Stack gap="base">
            {children}
          </Stack>
        </Card>

        {footer}
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
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: withAlpha(colors.paper, 0.08),
    ...shadows.lg,
  },
});
