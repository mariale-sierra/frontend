import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { colors, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

export function FeedErrorState() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Icon name="cloud-offline-outline" size={34} color={withAlpha(colors.paper, 0.3)} />
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
