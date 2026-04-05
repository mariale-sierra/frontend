import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>Challenge Detail</Text>
      <Text>ID: {id}</Text>
    </View>
  );
}