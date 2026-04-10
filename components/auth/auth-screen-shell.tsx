import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import ActivityBackground from '../layout/activityBackground';
import { GradientBox } from '../layout/gradient-box';
import { Stack } from '../layout/stack';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScreenShell({ title, subtitle, children, footer }: AuthScreenShellProps) {
  return (
    <ActivityBackground>
      <Stack align="center" justify="center" gap="xl" style={styles.content}>
        <Stack align="center" gap="sm">
          <Text variant="title" align="center">
            {title}
          </Text>
          <Text variant="body" tone="secondary" align="center">
            {subtitle}
          </Text>
        </Stack>

        <GradientBox
          colors={[colors.surfaceHighlight, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Stack gap="md" style={styles.cardContent}>
            {children}
          </Stack>
        </GradientBox>

        {footer}
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
});
