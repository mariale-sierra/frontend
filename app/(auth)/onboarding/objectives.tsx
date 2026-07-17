import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function Objectives() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.objectives')}</Text>
    </View>
  );
}
