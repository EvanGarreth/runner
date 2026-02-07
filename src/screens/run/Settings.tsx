import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { Text, View } from "@/components/Themed";
import { useRouter } from "expo-router";
import { getGpsInterval, setGpsInterval } from "@/utils/settings";

export default function Settings() {
  const router = useRouter();
  const [interval, setInterval] = useState(getGpsInterval().toString());

  const handleSave = () => {
    const intervalValue = parseInt(interval);

    if (isNaN(intervalValue) || intervalValue < 1 || intervalValue > 300) {
      Alert.alert("Invalid Interval", "GPS interval must be between 1 and 300 seconds");
      return;
    }

    try {
      setGpsInterval(intervalValue);
      Alert.alert("Settings Saved", "GPS tracking interval has been updated", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save settings");
    }
  };

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

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

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
    color: "#666",
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
    color: "#999",
    fontStyle: "italic",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
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
