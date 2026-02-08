import { useState, useEffect } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Alert, Switch } from "react-native";
import { Text, View } from "@/components/Themed";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  getGpsInterval,
  setGpsInterval,
  getWeatherTrackingEnabled,
  setWeatherTrackingEnabled,
  getUseMetricUnits,
  setUseMetricUnits,
} from "@/utils/settings";
import { ColorPicker } from "@/components/ColorPicker";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { baseColor, updateBaseColor, palette } = useTheme();
  const [interval, setInterval] = useState("5");
  const [weatherTracking, setWeatherTracking] = useState(false);
  const [useMetric, setUseMetric] = useState(false);
  const [selectedColor, setSelectedColor] = useState(baseColor);
  const [isLoading, setIsLoading] = useState(true);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 30,
    },
    settingContainer: {
      marginBottom: 30,
    },
    label: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 5,
    },
    description: {
      fontSize: 14,
      color: palette.textMuted,
      marginBottom: 15,
    },
    input: {
      borderWidth: 2,
      borderColor: "#ccc",
      borderRadius: 8,
      padding: 15,
      fontSize: 18,
      marginBottom: 10,
    },
    hint: {
      fontSize: 12,
      color: palette.textMuted,
      fontStyle: "italic",
    },
    toggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    toggleLabel: {
      flex: 1,
      marginRight: 15,
    },
    saveButton: {
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    saveButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
  });

  // Load settings from database on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const gpsInterval = await getGpsInterval(db);
        const weatherEnabled = await getWeatherTrackingEnabled(db);
        const metricEnabled = await getUseMetricUnits(db);

        setInterval(gpsInterval.toString());
        setWeatherTracking(weatherEnabled);
        setUseMetric(metricEnabled);
        setSelectedColor(baseColor);
      } catch (error) {
        console.error("Failed to load settings:", error);
        Alert.alert("Error", "Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [db, baseColor]);

  const handleSave = async () => {
    const intervalValue = parseInt(interval);

    if (isNaN(intervalValue) || intervalValue < 1 || intervalValue > 300) {
      Alert.alert("Invalid Interval", "GPS interval must be between 1 and 300 seconds");
      return;
    }

    try {
      await setGpsInterval(db, intervalValue);
      await setWeatherTrackingEnabled(db, weatherTracking);
      await setUseMetricUnits(db, useMetric);
      await updateBaseColor(selectedColor);

      Alert.alert("Settings Saved", "Your settings have been updated", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Run Settings</Text>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Run Settings</Text>

      <View style={styles.settingContainer}>
        <Text style={styles.label}>GPS Tracking Interval (seconds)</Text>
        <Text style={styles.description}>How often to record your location during runs</Text>

        <TextInput
          style={styles.input}
          value={interval}
          onChangeText={setInterval}
          keyboardType="number-pad"
          placeholder="5"
        />

        <Text style={styles.hint}>Lower values = more accurate route, higher battery usage</Text>
      </View>

      <View style={styles.settingContainer}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Text style={styles.label}>Weather Tracking</Text>
            <Text style={styles.description}>Save weather conditions at the end of each run</Text>
          </View>
          <Switch
            value={weatherTracking}
            onValueChange={setWeatherTracking}
            trackColor={{ false: "#ccc", true: palette.primary }}
            thumbColor={weatherTracking ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.settingContainer}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Text style={styles.label}>Use Metric Units</Text>
            <Text style={styles.description}>Display temperature in Celsius and wind speed in km/h</Text>
          </View>
          <Switch
            value={useMetric}
            onValueChange={setUseMetric}
            trackColor={{ false: "#ccc", true: palette.primary }}
            thumbColor={useMetric ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.settingContainer}>
        <Text style={styles.label}>Theme Color</Text>
        <Text style={styles.description}>Choose your preferred color scheme</Text>
        <ColorPicker selectedColor={selectedColor} onSelectColor={setSelectedColor} />
      </View>

      <TouchableOpacity style={[styles.saveButton, { backgroundColor: palette.primary }]} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </View>
  );
}
