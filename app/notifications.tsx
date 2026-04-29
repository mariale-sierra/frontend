import { View, Text } from "react-native";
import { useTranslation } from 'react-i18next';

export default function Notifications() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.notifications')}</Text>
    </View>
  );
}