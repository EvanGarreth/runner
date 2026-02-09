import { StyleSheet, TouchableOpacity, TouchableHighlight, View as RNView } from "react-native";
import { Text, View } from "@/components/Themed";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { requestLocationPermissions, requestBackgroundPermissions, getCurrentLocation } from "@/utils/location";
import { useTheme } from "@/contexts/ThemeContext";
import { logger } from "@/utils/logger";

export default function NewRun() {
  const router = useRouter();
  const { palette } = useTheme();

  // Warm up GPS on mount
  useEffect(() => {
    const warmUpGPS = async () => {
      logger.log("Warming up GPS...");

      // Request permissions first
      const foregroundGranted = await requestLocationPermissions();
      if (!foregroundGranted) {
        logger.log("Foreground permissions not granted, skipping GPS warmup");
        return;
      }

      const backgroundGranted = await requestBackgroundPermissions();
      if (!backgroundGranted) {
        logger.log("Background permissions not granted, skipping GPS warmup");
        return;
      }

      // Get initial location to warm up GPS
      const location = await getCurrentLocation();
      if (location) {
        logger.log("GPS warmed up successfully:", location);
      } else {
        logger.log("Failed to get initial GPS location");
      }
    };

    warmUpGPS();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 15,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
    },
    settingsButton: {
      padding: 5,
    },
    runOptionsContainer: {
      flex: 1,
      flexDirection: "column",
      width: "100%",
      alignItems: "center",
      justifyContent: "space-evenly",
    },
    item: {
      backgroundColor: palette.cardBackground,
      width: "70%",
      height: "28%",
      borderRadius: 10,
      overflow: "hidden",
    },
    itemContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    itemText: {
      fontSize: 20,
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Run Type</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/runs/settings")}>
          <FontAwesome5 name="cog" size={24} color={palette.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.runOptionsContainer}>
        <TouchableHighlight
          style={styles.item}
          onPress={() => router.push("/runs/config-timed")}
          underlayColor={palette.cardHighlight}
          activeOpacity={0.8}
        >
          <RNView style={styles.itemContent}>
            <FontAwesome5 name="stopwatch" size={32} />
            <Text style={styles.itemText}>Timed</Text>
          </RNView>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.item}
          onPress={() => router.push("/runs/config-distance")}
          underlayColor={palette.cardHighlight}
          activeOpacity={0.8}
        >
          <RNView style={styles.itemContent}>
            <FontAwesome5 name="ruler" size={32} />
            <Text style={styles.itemText}>Distance</Text>
          </RNView>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.item}
          onPress={() => router.push("/runs/active?type=F")}
          underlayColor={palette.cardHighlight}
          activeOpacity={0.8}
        >
          <RNView style={styles.itemContent}>
            <FontAwesome5 name="road" size={32} />
            <Text style={styles.itemText}>Free Run</Text>
          </RNView>
        </TouchableHighlight>
      </View>
    </View>
  );
}
