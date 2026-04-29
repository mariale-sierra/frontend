import { View, Text } from "react-native";
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.profile')}</Text>
    </View>
  );
}