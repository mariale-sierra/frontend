import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Text } from '../../components/ui/text';

export default function Search() {
  const { t } = useTranslation();

  return (
    <ScreenBackground variant="challenges">
      <View style={styles.center}>
        <Text variant="title">{t('search.screenTitle', 'Search')}</Text>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
