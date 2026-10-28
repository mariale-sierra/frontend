import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScroll } from '../../../components/layout/keyboardAwareScroll';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/button';
import { SpaceForm } from '../../../components/spaces/SpaceForm';
import type { SpaceFormHandle } from '../../../components/spaces/SpaceForm';
import { createSpace } from '../../../services/spaces/spaces.service';
import { colors, spacing } from '../../../constants/theme';
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
    // Sprint 10: laid out like Edit profile — its compact top bar (a small bold
    // centered title, not the big `title`) over the same top-lit background.
    <ScreenBackground variant="top">
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('spaces.createTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.contentWrap}>
        <KeyboardAwareScroll style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SpaceForm
            ref={formRef}
            onAccentColorChange={setAccentColor}
            onSubmit={handleSubmit}
          />
        </KeyboardAwareScroll>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: 44,
    height: 44,
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
  // Sprint 10: the Create button sits right on the background, without the
  // gray `surface` slab (like the metrics screen's bottom bar now).
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  submitError: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
});
