/**
 * Theme Context Provider
 * Manages global theme state and provides color palette to components
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { generatePalette, ColorPalette } from "@/utils/colorPalette";

interface ThemeContextType {
  baseColor: string;
  palette: ColorPalette;
  isLoading: boolean;
  updateBaseColor: (color: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme() ?? "light";
  const [baseColor, setBaseColor] = useState("#4CAF50");
  const [palettes, setPalettes] = useState(generatePalette("#4CAF50"));
  const [isLoading, setIsLoading] = useState(true);

  const loadTheme = React.useCallback(async () => {
    try {
      const result = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'themeBaseColor'"
      );

      if (result?.value) {
        const color = result.value;
        setBaseColor(color);
        setPalettes(generatePalette(color));
      }
    } catch (error) {
      console.error("Error loading theme from database:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // Load theme from database on mount
  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const updateBaseColor = async (color: string) => {
    try {
      await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES ('themeBaseColor', ?)", [color]);
      setBaseColor(color);
      setPalettes(generatePalette(color));
    } catch (error) {
      console.error("Error updating theme color:", error);
      throw error;
    }
  };

  const activePalette = colorScheme === "dark" ? palettes.dark : palettes.light;

  return (
    <ThemeContext.Provider value={{ baseColor, palette: activePalette, isLoading, updateBaseColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function useThemedColor(colorKey: keyof ColorPalette): string {
  const { palette } = useTheme();
  return palette[colorKey];
}
