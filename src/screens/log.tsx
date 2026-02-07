import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text, View } from "@/components/Themed";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState, useCallback } from "react";
import { formatDistance, formatTime, calculatePace } from "@/utils/location";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface Run {
  id: number;
  type: string;
  start: string;
  end: string;
  miles: number;
  rating: number;
  note: string;
}

export default function Log() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRuns = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await db.getAllAsync<Run>(
        "SELECT id, type, start, end, miles, rating, note FROM runs WHERE rating > 0 ORDER BY start DESC"
      );
      setRuns(result);
    } catch (error) {
      console.error("Error loading runs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // Reload runs when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRuns();
    }, [loadRuns])
  );

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const getRunTypeName = (type: string) => {
    switch (type) {
      case "T":
        return "Timed";
      case "D":
        return "Distance";
      case "F":
        return "Free";
      default:
        return "Run";
    }
  };

  const getRunTypeIcon = (type: string) => {
    switch (type) {
      case "T":
        return "clock-o";
      case "D":
        return "road";
      case "F":
        return "flag";
      default:
        return "circle";
    }
  };

  const renderRun = ({ item: run }: { item: Run }) => {
    const start = new Date(run.start);
    const end = new Date(run.end);
    const duration = (end.getTime() - start.getTime()) / 1000;

    return (
      <TouchableOpacity style={styles.runCard} onPress={() => router.push(`/runs/${run.id}`)}>
        <View style={styles.runCardLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome name={getRunTypeIcon(run.type)} size={24} color="#4CAF50" />
          </View>
          <View style={styles.runInfo}>
            <Text style={styles.runType}>{getRunTypeName(run.type)} Run</Text>
            <Text style={styles.runDate}>
              {start.toLocaleDateString()} at {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <View style={styles.runStats}>
              <Text style={styles.runStat}>{formatDistance(run.miles)}</Text>
              <Text style={styles.runStatDivider}>•</Text>
              <Text style={styles.runStat}>{formatTime(duration)}</Text>
              <Text style={styles.runStatDivider}>•</Text>
              <Text style={styles.runStat}>{calculatePace(run.miles, duration)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.runCardRight}>
          <View style={styles.ratingContainer}>
            {[...Array(run.rating)].map((_, i) => (
              <FontAwesome key={i} name="star" size={14} color="#FFD700" />
            ))}
          </View>
          {run.note && run.note.length > 0 && (
            <FontAwesome name="file-text-o" size={16} color="#666" style={styles.noteIcon} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (runs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Log</Text>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <Text style={styles.emptyText}>No completed runs yet.</Text>
        <Text style={styles.emptySubtext}>Your run history will appear here!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <FlatList
        data={runs}
        renderItem={renderRun}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: "100%",
  },
  emptyText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    color: "#999",
  },
  listContent: {
    paddingBottom: 20,
  },
  runCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 12,
  },
  runCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  runInfo: {
    flex: 1,
  },
  runType: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  runDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  runStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  runStat: {
    fontSize: 12,
    color: "#333",
  },
  runStatDivider: {
    marginHorizontal: 6,
    color: "#999",
    fontSize: 12,
  },
  runCardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 4,
  },
  noteIcon: {
    marginTop: 4,
  },
});
