/**
 * Color Picker Component
 * Simple preset color selector with 8 popular colors
 */

import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRESET_COLORS = [
  { name: "Green", hex: "#4CAF50" },
  { name: "Blue", hex: "#2196F3" },
  { name: "Orange", hex: "#FF9800" },
  { name: "Purple", hex: "#9C27B0" },
  { name: "Teal", hex: "#009688" },
  { name: "Red", hex: "#F44336" },
  { name: "Indigo", hex: "#3F51B5" },
  { name: "Pink", hex: "#E91E63" },
];

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  return (
    <View style={styles.container}>
      {PRESET_COLORS.map((color) => {
        const isSelected = selectedColor.toUpperCase() === color.hex.toUpperCase();
        return (
          <TouchableOpacity
            key={color.hex}
            style={[styles.colorSwatch, { backgroundColor: color.hex, borderWidth: isSelected ? 3 : 0 }]}
            onPress={() => onSelectColor(color.hex)}
            activeOpacity={0.7}
          >
            {isSelected && <Ionicons name="checkmark" size={24} color="#fff" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
