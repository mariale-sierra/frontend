import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from 'react-i18next';

export default function SpaceDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>{t('placeholders.space')}</Text>
      <Text>{t('placeholders.idLabel', { id: String(id ?? '') })}</Text>
    </View>
  );
}