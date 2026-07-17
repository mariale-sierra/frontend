import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function ProfileType() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.profileType')}</Text>
    </View>
  );
}
