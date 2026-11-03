import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ErrorBoundaryProps } from 'expo-router';
import i18n from '../../i18n';
import { colors, fontFamily, fontSize, lineHeight, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { logError } from '../../utils/apiError';

/**
 * Last-resort screen when a route throws while rendering: instead of a blank
 * app (release) or the full-screen red box (dev), a short message and a
 * "Try again" that re-renders the route (`retry`).
 *
 * Exported as `ErrorBoundary` from app/_layout.tsx, so expo-router renders it
 * in place of the whole tree — no providers are guaranteed above it. That's
 * why it uses plain React Native views, `i18n.t` directly and theme tokens,
 * not `Text`/`Button` (which read the theme context) or `useTranslation`.
 */
export function AppErrorFallback({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    logError('AppErrorBoundary', error);
  }, [error]);

  return (
    <View style={styles.root}>
      <Ionicons name="alert-circle-outline" size={ICON_SIZE} color={colors.paper} />
      <Text style={styles.title}>{i18n.t('common.errorBoundary.title')}</Text>
      <Text style={styles.message}>{i18n.t('common.errorBoundary.message')}</Text>
      <Pressable
        onPress={() => void retry()}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonLabel}>{i18n.t('common.errorBoundary.retry')}</Text>
      </Pressable>
    </View>
  );
}

const ICON_SIZE = 40;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    color: withAlpha(colors.paper, textOpacity.primary),
    textAlign: 'center',
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    color: withAlpha(colors.paper, textOpacity.secondary),
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.base,
    backgroundColor: colors.primary,
    borderRadius: radius.big,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    color: colors.ink,
  },
});
