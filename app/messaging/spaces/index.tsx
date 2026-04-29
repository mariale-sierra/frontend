import { View, Text } from "react-native";
import { useTranslation } from 'react-i18next';

export default function Spaces() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.spaces')}</Text>
    </View>
  );
}