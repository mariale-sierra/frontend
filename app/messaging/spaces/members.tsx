import { View, Text } from "react-native";
import { useTranslation } from 'react-i18next';

export default function Members() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.members')}</Text>
    </View>
  );
}