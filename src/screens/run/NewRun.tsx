import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Link } from "expo-router";

export default function NewRun() {
  return (
    <View style={styles.container}>
      <Text style={styles.item}>
        <FontAwesome5 name="stopwatch-20" /> Timed
      </Text>

      <Text style={styles.item}>
        <Link href="/runs">
          <FontAwesome5 name="ruler" /> Distance
        </Link>
      </Text>
      <Text style={styles.item}>
        <FontAwesome5 name="road" /> Free Run
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-evenly",
    flex: 1,
    padding: 15,
  },
  item: {
    fontSize: 20,
    backgroundColor: "#ccc",
    width: "50%",
    height: "30%",
    textAlign: "center",
    textAlignVertical: "center",
  },
});
