import { useState, useRef } from "react";
import { StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, View as RNView } from "react-native";
import { Text, View } from "@/components/Themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatDistance, formatTime } from "@/utils/location";
import { useSQLiteContext } from "expo-sqlite";
import FontAwesome from "@expo/vector-icons/FontAwesome";

type RunType = "T" | "D" | "F";

export default function CompleteRun() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const db = useSQLiteContext();

  const runId = params.runId ? parseInt(params.runId as string) : 0;
  const distance = params.distance ? parseFloat(params.distance as string) : 0;
  const time = params.time ? parseInt(params.time as string) : 0;
  const runType = params.type as RunType;

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const notesInputRef = useRef<RNView>(null);

  const getRunTypeName = () => {
    switch (runType) {
      case "T":
        return "Timed Run";
      case "D":
        return "Distance Run";
      case "F":
        return "Free Run";
      default:
        return "Run";
    }
  };

  const handleSave = async () => {
    if (rating === 0) {
      return; // Button should be disabled, but extra safety
    }

    setIsSaving(true);

    try {
      await db.runAsync("UPDATE runs SET rating = ?, note = ? WHERE id = ?", [rating, note, runId]);
      router.replace("/");
    } catch (error) {
      console.error("Error updating run:", error);
      Alert.alert("Error", "Failed to save rating and notes. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Run Complete!</Text>

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>Run Type</Text>
            <Text style={styles.summaryValue}>{getRunTypeName()}</Text>

            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>{formatDistance(distance)}</Text>

            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{formatTime(time)}</Text>
          </View>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>How was your run?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
                  <FontAwesome name={star <= rating ? "star" : "star-o"} size={40} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.notesContainer} ref={notesInputRef}>
            <Text style={styles.notesLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="How did you feel? Any highlights or challenges?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
              onFocus={() => {
                setTimeout(() => {
                  notesInputRef.current?.measureLayout(
                    scrollViewRef.current as any,
                    (x, y) => {
                      scrollViewRef.current?.scrollTo({
                        y: y - 20,
                        animated: true,
                      });
                    },
                    () => {
                      // Fallback if measureLayout fails
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }
                  );
                }, 300);
              }}
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, rating === 0 && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={rating === 0 || isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save Run"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  summaryContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 15,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 5,
  },
  ratingContainer: {
    alignItems: "center",
    marginBottom: 30,
    paddingVertical: 20,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  starButton: {
    padding: 5,
  },
  notesContainer: {
    marginBottom: 30,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
