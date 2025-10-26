import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

export default function NewRun() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Run</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text>Select Type:</Text>
      <Text>
        <FontAwesome5 name="stopwatch-20" /> Timed
      </Text>
      <Text>Distance</Text>
      <Text>Free Run</Text>
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
