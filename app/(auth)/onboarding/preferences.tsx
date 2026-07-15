import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function Preferences() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.preferences')}</Text>
    </View>
  );
}
