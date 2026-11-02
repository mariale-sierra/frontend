import { StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import { Text } from '../../ui/text';
import { ChallengeCoverTile } from '../card/ChallengeCoverTile';
import { spacing } from '../../../constants/theme';
import type { ChallengeCoverPhoto } from '../../../store/challengeBuilderStore';

interface ChallengeCoverPickerProps {
  photo: ChallengeCoverPhoto | null;
  onChange: (photo: ChallengeCoverPhoto | null) => void;
}

const PREVIEW_SIZE = 184;

/**
 * Create challenge, optional photo step (Sprint 10): pick a square photo from
 * the gallery (same picker settings as the profile photo), see it as it will
 * look — the same tilted tile as the Explore card — change it or remove it.
 * Skipping is just Continue with nothing picked.
 */
export function ChallengeCoverPicker({ photo, onChange }: ChallengeCoverPickerProps) {
  const { t } = useTranslation();

  async function handlePick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (!asset?.uri) return;
    onChange({ uri: asset.uri, mimeType: asset.mimeType });
  }

  return (
    <View style={styles.container} testID="challenge-cover-picker">
      <ChallengeCoverTile imageUrl={photo?.uri} size={PREVIEW_SIZE} rotateDeg={3} testID="challenge-cover-preview" />

      <View style={styles.actions}>
        <Button variant="outline" size="sm" onPress={handlePick} testID="challenge-cover-pick">
          {photo ? t('challengeCreate.cover.change') : t('challengeCreate.cover.pick')}
        </Button>
        {photo ? (
          <Button variant="subtle" size="sm" onPress={() => onChange(null)} testID="challenge-cover-remove">
            {t('challengeCreate.cover.remove')}
          </Button>
        ) : null}
      </View>

      <Text variant="caption" tone="secondary" align="center">
        {photo ? t('challengeCreate.cover.reviewHint') : t('challengeCreate.cover.skipHint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
