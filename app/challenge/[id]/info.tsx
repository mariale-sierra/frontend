import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/ui/text';
import { spacing } from '../../../constants/theme';
import { useTranslation } from 'react-i18next';

export default function ChallengeInfo() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text variant="title">{t('placeholders.challengeInfoTitle')}</Text>
      <Text variant="body">{t('placeholders.challengeInfoSubtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
});