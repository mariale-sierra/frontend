import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function Chat() {
  const { conversationId } = useLocalSearchParams();

  return (
    <View>
      <Text>Chat Screen</Text>
      <Text>ID: {conversationId}</Text>
    </View>
  );
}