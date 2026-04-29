import { View, Text } from "react-native";
import { useTranslation } from 'react-i18next';

export default function Messaging() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.chats')}</Text>
    </View>
  );
}