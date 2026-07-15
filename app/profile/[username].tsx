import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

export default function UserProfile() {
  const { username } = useLocalSearchParams();
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('placeholders.userProfile')}</Text>
      <Text>{username}</Text>
    </View>
  );
}
