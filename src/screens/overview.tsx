import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { getHMS } from "@/utils/time";

interface Run {
  miles: number;
  duration: number;
}

export default function Overview() {
  const db = useSQLiteContext();
  const [runs, setRuns] = useState<Run[]>([
    { miles: 2.3, duration: 2404 },
    { miles: 3.3, duration: 5555 },
    { miles: 0.5, duration: 6467 },
    { miles: 1.4, duration: 546 },
    { miles: 1.4, duration: 4444 },
  ]);

  useEffect(() => {
    async function setup() {
      const result = await db.getAllSync<Run>("SELECT (miles, duration) from RUNS");
      setRuns(result);
    }
    setup();
  }, []);

  const miles = runs.reduce((t, r) => t + r.miles, 0);
  const hms = getHMS(runs.reduce((t, r) => t + r.duration, 0));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Overview</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text>Runs: {runs.length}</Text>
      <Text>Distance: {miles}</Text>
      <Text>
        Duration: {hms.hours} Hours, {hms.minutes} Minutes, {hms.seconds} Seconds
      </Text>
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
