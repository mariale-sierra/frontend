import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/button';
import { SpaceForm } from '../../../components/spaces/SpaceForm';
import type { SpaceFormHandle } from '../../../components/spaces/SpaceForm';
import { createSpace } from '../../../services/spaces/spaces.service';
import { colors, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import type { CreateSpacePayload } from '../../../types/space';

/** Create-space screen — wireframe Chats-47C is the SAME screen for create
 * and edit; this route just wraps SpaceForm with no initial values and
 * routes to the new space's info screen on success. */
export default function CreateSpaceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const formRef = useRef<SpaceFormHandle>(null);
  const [accentColor, setAccentColor] = useState<string>(colors.primary);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(payload: CreateSpacePayload) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const space = await createSpace(payload);
      router.replace(`/messaging/spaces/${space.id}`);
    } catch {
      setSubmitError(t('spaces.createError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Text variant="title">{t('spaces.createTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.contentWrap}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SpaceForm
            ref={formRef}
            onAccentColorChange={setAccentColor}
            onSubmit={handleSubmit}
          />
        </ScrollView>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {/* Always visible regardless of scroll position — see SpaceForm's
            own doc comment for why this moved out of its scrollable
            content. */}
        {submitError ? (
          <Text variant="caption" style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}
        <Button
          onPress={() => formRef.current?.submit()}
          loading={submitting}
          textWeight="bold"
          style={{ backgroundColor: accentColor }}
        >
          {t('spaces.createSubmitCta')}
        </Button>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  headerSpacer: {
    width: 40,
  },
  contentWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  // Same sticky-footer chrome as manage.tsx / the metrics screen's own
  // bottom bar (app/(add)/metrics.tsx).
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  submitError: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
});
