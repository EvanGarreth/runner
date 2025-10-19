import { FlatList, StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

interface Run {
  id: number;
  type: string;
  start: Date;
  end: Date;
  miles: number;
}

export default function Log() {
  const db = useSQLiteContext();
  const [runs, setRuns] = useState<Run[]>([
    { id: 1, type: "F", start: new Date(2025, 2, 4, 7, 30), end: new Date(2025, 2, 4, 8), miles: 3.11 },
    {
      id: 2,
      type: "T",
      start: new Date(2025, 2, 5, 6, 50),
      end: new Date(2025, 2, 5, 7, 25),
      miles: 3.41,
    },
  ]);

  // TODO: don't depend on en-US
  const formatter = new Intl.DateTimeFormat(`en-US`, { dateStyle: `short` });

  // useEffect(() => {
  //   async function setup() {
  //     const result = await db.getAllSync<Run>("SELECT (id, type, start, end, miles) from RUNS ORDER BY start DESC");
  //     setRuns(result);
  //   }
  //   setup();
  // }, []);

  // use SectionList w/ dates
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <FlatList
        style={styles.list}
        data={runs}
        renderItem={(run) => (
          <Text style={styles.item}>
            {run.item.type} - {formatter.format(run.item.start)} - a
          </Text>
        )}
      />
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
