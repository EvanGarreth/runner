import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import { useLocalSearchParams } from "expo-router";

export default function Run() {
  const local = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Run {local.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  list: {
    display: "flex",
    height: "100%",
  },
  item: {
    fontSize: 20,
  },
});
