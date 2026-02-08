import { StyleSheet, ScrollView, ActivityIndicator, TouchableHighlight, View as RNView } from "react-native";
import { Text, View } from "@/components/Themed";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState, useCallback } from "react";
import { formatDistance, formatTime, calculatePace } from "@/utils/location";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme } from "@/contexts/ThemeContext";

interface Run {
  id: number;
  type: string;
  start: string;
  end: string;
  miles: number;
  rating: number;
}

export default function Overview() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { palette } = useTheme();
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRuns = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await db.getAllAsync<Run>(
        "SELECT id, type, start, end, miles, rating FROM runs WHERE rating > 0 ORDER BY start DESC"
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

  const totalMiles = runs.reduce((total, run) => total + run.miles, 0);
  const totalSeconds = runs.reduce((total, run) => {
    const start = new Date(run.start).getTime();
    const end = new Date(run.end).getTime();
    return total + (end - start) / 1000;
  }, 0);

  const averagePace = totalMiles > 0 ? calculatePace(totalMiles, totalSeconds) : "--:--";
  const recentRuns = runs.slice(0, 5);

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

  const styles = StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 20,
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
      color: palette.textMuted,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: "center",
      marginTop: 10,
      color: palette.textMuted,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    statCard: {
      width: "48%",
      padding: 16,
      borderRadius: 12,
      backgroundColor: palette.cardBackground,
      marginBottom: 12,
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: palette.textMuted,
      textAlign: "center",
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 15,
    },
    runCard: {
      borderRadius: 12,
      backgroundColor: palette.cardBackground,
      marginBottom: 12,
      overflow: "hidden",
    },
    runCardContainer: {
      padding: 16,
    },
    runCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    runType: {
      fontSize: 16,
      fontWeight: "bold",
    },
    ratingContainer: {
      flexDirection: "row",
      gap: 2,
    },
    runDate: {
      fontSize: 14,
      color: palette.textMuted,
      marginBottom: 8,
    },
    runStats: {
      flexDirection: "row",
      alignItems: "center",
    },
    runStat: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    runStatDivider: {
      marginHorizontal: 8,
      color: palette.textMuted,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (runs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Overview</Text>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <Text style={styles.emptyText}>No completed runs yet.</Text>
        <Text style={styles.emptySubtext}>Start a run and complete it to see your stats here!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Overview</Text>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

        <View style={styles.statsGrid}>
          <RNView style={styles.statCard}>
            <Text style={styles.statValue}>{runs.length}</Text>
            <Text style={styles.statLabel}>Total Runs</Text>
          </RNView>

          <RNView style={styles.statCard}>
            <Text style={styles.statValue}>{formatDistance(totalMiles)}</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </RNView>

          <RNView style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(totalSeconds)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </RNView>

          <RNView style={styles.statCard}>
            <Text style={styles.statValue}>{averagePace}</Text>
            <Text style={styles.statLabel}>Avg Pace (min/mi)</Text>
          </RNView>
        </View>

        <Text style={styles.sectionTitle}>Recent Runs</Text>
        {recentRuns.map((run) => {
          const start = new Date(run.start);
          const end = new Date(run.end);
          const duration = (end.getTime() - start.getTime()) / 1000;

          return (
            <TouchableHighlight
              key={run.id}
              style={styles.runCard}
              onPress={() => router.push(`/runs/${run.id}`)}
              underlayColor={palette.cardHighlight}
              activeOpacity={0.8}
            >
              <RNView style={styles.runCardContainer}>
                <RNView style={styles.runCardHeader}>
                  <Text style={styles.runType}>{getRunTypeName(run.type)} Run</Text>
                  <RNView style={styles.ratingContainer}>
                    {[...Array(run.rating)].map((_, i) => (
                      <FontAwesome key={i} name="star" size={14} color="#FFD700" />
                    ))}
                  </RNView>
                </RNView>
                <Text style={styles.runDate}>
                  {start.toLocaleDateString()} at {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <RNView style={styles.runStats}>
                  <Text style={styles.runStat}>{formatDistance(run.miles)}</Text>
                  <Text style={styles.runStatDivider}>•</Text>
                  <Text style={styles.runStat}>{formatTime(duration)}</Text>
                  <Text style={styles.runStatDivider}>•</Text>
                  <Text style={styles.runStat}>{calculatePace(run.miles, duration)} pace</Text>
                </RNView>
              </RNView>
            </TouchableHighlight>
          );
        })}
      </View>
    </ScrollView>
  );
}
