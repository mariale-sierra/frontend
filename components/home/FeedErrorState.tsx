import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { spacing } from '../../constants/theme';

export function FeedErrorState() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Icon name="cloud-offline-outline" size={34} color="rgba(255,255,255,0.3)" />
      <Text variant="body" tone="secondary" align="center">
        {t('home.feedErrorMessage')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing['2xl'],
  },
});
