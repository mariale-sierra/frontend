import { View, Text } from "react-native";
import { Link } from "expo-router";


export default function Home() {
  return (
    <View>
      <Link href="/dev/ui-test">Go to UI Test</Link>

      <View>
        <Text>Home Screen</Text>
      </View>
    </View>
  );
}