import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function RecoverPassword() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.recoverPassword')}</Text>
    </View>
  );
}
