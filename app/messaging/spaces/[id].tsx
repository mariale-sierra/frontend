import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function SpaceDetail() {
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>Space</Text>
      <Text>ID: {id}</Text>
    </View>
  );
}