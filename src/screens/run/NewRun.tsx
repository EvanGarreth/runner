import { StyleSheet, TouchableOpacity } from "react-native";
import { Text, View } from "@/components/Themed";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { requestLocationPermissions, requestBackgroundPermissions, getCurrentLocation } from "@/utils/location";

export default function NewRun() {
  const router = useRouter();

  // Warm up GPS on mount
  useEffect(() => {
    const warmUpGPS = async () => {
      console.log("Warming up GPS...");

      // Request permissions first
      const foregroundGranted = await requestLocationPermissions();
      if (!foregroundGranted) {
        console.log("Foreground permissions not granted, skipping GPS warmup");
        return;
      }

      const backgroundGranted = await requestBackgroundPermissions();
      if (!backgroundGranted) {
        console.log("Background permissions not granted, skipping GPS warmup");
        return;
      }

      // Get initial location to warm up GPS
      const location = await getCurrentLocation();
      if (location) {
        console.log("GPS warmed up successfully:", location);
      } else {
        console.log("Failed to get initial GPS location");
      }
    };

    warmUpGPS();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Run Type</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/runs/settings")}>
          <FontAwesome5 name="cog" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.runOptionsContainer}>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/runs/config-timed")}>
          <FontAwesome5 name="stopwatch" size={32} />
          <Text style={styles.itemText}>Timed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => router.push("/runs/config-distance")}>
          <FontAwesome5 name="ruler" size={32} />
          <Text style={styles.itemText}>Distance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => router.push("/runs/active?type=F")}>
          <FontAwesome5 name="road" size={32} />
          <Text style={styles.itemText}>Free Run</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    backgroundColor: "#ccc",
    width: "70%",
    height: "28%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    gap: 10,
  },
  itemText: {
    fontSize: 20,
    fontWeight: "600",
  },
});
