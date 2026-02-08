import { FlatList, StyleSheet, TouchableHighlight, TouchableOpacity, ActivityIndicator, View as RNView } from "react-native";
import { Text, View } from "@/components/Themed";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState, useCallback } from "react";
import { formatDistance, formatTime, calculatePace } from "@/utils/location";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { palette } = useTheme();
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
    settingsButton: {
      position: "absolute",
      top: 20,
      right: 20,
      padding: 8,
      zIndex: 10,
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
    listContent: {
      paddingBottom: 20,
    },
    runCard: {
      borderRadius: 12,
      backgroundColor: palette.cardBackground,
      marginBottom: 12,
      overflow: "hidden",
    },
    runCardContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
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
      backgroundColor: palette.iconBackground,
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
      color: palette.textMuted,
      marginBottom: 6,
    },
    runStats: {
      flexDirection: "row",
      alignItems: "center",
    },
    runStat: {
      fontSize: 12,
      color: palette.textSecondary,
    },
    runStatDivider: {
      marginHorizontal: 6,
      color: palette.textMuted,
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

  const renderRun = ({ item: run }: { item: Run }) => {
    const start = new Date(run.start);
    const end = new Date(run.end);
    const duration = (end.getTime() - start.getTime()) / 1000;

    return (
      <TouchableHighlight
        style={styles.runCard}
        onPress={() => router.push(`/runs/${run.id}`)}
        underlayColor={palette.cardHighlight}
        activeOpacity={0.8}
      >
        <RNView style={styles.runCardContainer}>
          <RNView style={styles.runCardLeft}>
            <RNView style={styles.iconContainer}>
              <FontAwesome name={getRunTypeIcon(run.type)} size={24} color={palette.primary} />
            </RNView>
            <RNView style={styles.runInfo}>
              <Text style={styles.runType}>{getRunTypeName(run.type)} Run</Text>
              <Text style={styles.runDate}>
                {start.toLocaleDateString()} at {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
              <RNView style={styles.runStats}>
                <Text style={styles.runStat}>{formatDistance(run.miles)}</Text>
                <Text style={styles.runStatDivider}>•</Text>
                <Text style={styles.runStat}>{formatTime(duration)}</Text>
                <Text style={styles.runStatDivider}>•</Text>
                <Text style={styles.runStat}>{calculatePace(run.miles, duration)}</Text>
              </RNView>
            </RNView>
          </RNView>
          <RNView style={styles.runCardRight}>
            <RNView style={styles.ratingContainer}>
              {[...Array(run.rating)].map((_, i) => (
                <FontAwesome key={i} name="star" size={14} color="#FFD700" />
              ))}
            </RNView>
            {run.note && run.note.length > 0 && (
              <FontAwesome name="file-text-o" size={16} color={palette.textMuted} style={styles.noteIcon} />
            )}
          </RNView>
        </RNView>
      </TouchableHighlight>
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
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/runs/settings")}>
          <FontAwesome5 name="cog" size={24} color={palette.textMuted} />
        </TouchableOpacity>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <Text style={styles.emptyText}>No completed runs yet.</Text>
        <Text style={styles.emptySubtext}>Your run history will appear here!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/runs/settings")}>
        <FontAwesome5 name="cog" size={24} color={palette.textMuted} />
      </TouchableOpacity>
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
