import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { SpaceForm } from '../../../components/spaces/SpaceForm';
import { createSpace } from '../../../services/spaces/spaces.service';
import { spacing } from '../../../constants/theme';
import type { CreateSpacePayload } from '../../../types/space';

/** Create-space screen — wireframe Chats-47C is the SAME screen for create
 * and edit; this route just wraps SpaceForm with no initial values and
 * routes to the new space's info screen on success. */
export default function CreateSpaceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SpaceForm
          submitLabel={t('spaces.createSubmitCta')}
          submitting={submitting}
          submitError={submitError}
          onSubmit={handleSubmit}
        />
      </ScrollView>
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
    paddingBottom: spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
});
