import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Text, View } from "@/components/Themed";
import { useRouter } from "expo-router";

export default function ConfigDistance() {
  const router = useRouter();
  const [distance, setDistance] = useState("5.0");
  const [unit, setUnit] = useState<"miles" | "km">("miles");

  const handleStart = () => {
    const distanceValue = parseFloat(distance);

    if (isNaN(distanceValue) || distanceValue <= 0) {
      alert("Please enter a valid distance");
      return;
    }

    // Convert to miles if in km
    const distanceInMiles = unit === "km" ? distanceValue * 0.621371 : distanceValue;

    router.push(`/runs/active?type=D&targetDistance=${distanceInMiles}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Target Distance</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={distance}
          onChangeText={setDistance}
          keyboardType="decimal-pad"
          placeholder="5.0"
        />
      </View>

      <View style={styles.unitContainer}>
        <TouchableOpacity
          style={[styles.unitButton, unit === "miles" && styles.unitButtonActive]}
          onPress={() => setUnit("miles")}
        >
          <Text style={[styles.unitButtonText, unit === "miles" && styles.unitButtonTextActive]}>Miles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.unitButton, unit === "km" && styles.unitButtonActive]}
          onPress={() => setUnit("km")}
        >
          <Text style={[styles.unitButtonText, unit === "km" && styles.unitButtonTextActive]}>Kilometers</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startButtonText}>Start Run</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
  },
  inputContainer: {
    width: "80%",
    marginBottom: 30,
  },
  input: {
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 15,
    fontSize: 32,
    textAlign: "center",
    fontWeight: "bold",
  },
  unitContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 40,
  },
  unitButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  unitButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  unitButtonText: {
    fontSize: 16,
    color: "#666",
  },
  unitButtonTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  startButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
