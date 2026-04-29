import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from 'react-i18next';

export default function Chat() {
  const { t } = useTranslation();
  const { conversationId } = useLocalSearchParams();

  return (
    <View>
      <Text>{t('placeholders.chat')}</Text>
      <Text>{t('placeholders.idLabel', { id: String(conversationId ?? '') })}</Text>
    </View>
  );
}