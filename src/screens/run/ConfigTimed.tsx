import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Text, View } from "@/components/Themed";
import { useRouter } from "expo-router";

export default function ConfigTimed() {
  const router = useRouter();
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [seconds, setSeconds] = useState("0");

  const handleStart = () => {
    const totalSeconds = parseInt(hours || "0") * 3600 + parseInt(minutes || "0") * 60 + parseInt(seconds || "0");

    if (totalSeconds <= 0) {
      alert("Please enter a valid time duration");
      return;
    }

    router.push(`/runs/active?type=T&targetSeconds=${totalSeconds}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Timer Duration</Text>

      <View style={styles.inputContainer}>
        <View style={styles.timeInput}>
          <TextInput
            style={styles.input}
            value={hours}
            onChangeText={setHours}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="0"
          />
          <Text style={styles.label}>Hours</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeInput}>
          <TextInput
            style={styles.input}
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="0"
          />
          <Text style={styles.label}>Minutes</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeInput}>
          <TextInput
            style={styles.input}
            value={seconds}
            onChangeText={setSeconds}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="0"
          />
          <Text style={styles.label}>Seconds</Text>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  timeInput: {
    alignItems: "center",
  },
  input: {
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    width: 70,
    height: 70,
    fontSize: 32,
    textAlign: "center",
    fontWeight: "bold",
  },
  label: {
    fontSize: 12,
    marginTop: 5,
    color: "#666",
  },
  separator: {
    fontSize: 32,
    fontWeight: "bold",
    marginHorizontal: 10,
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
