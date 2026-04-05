import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function UserProfile() {
  const { username } = useLocalSearchParams();

  return (
    <View>
      <Text>User Profile</Text>
      <Text>{username}</Text>
    </View>
  );
}