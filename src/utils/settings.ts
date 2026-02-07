/**
 * User settings and preferences
 * TODO: Persist to database or AsyncStorage
 */

interface Settings {
  gpsIntervalSeconds: number;
}

// Default settings
const defaultSettings: Settings = {
  gpsIntervalSeconds: 5,
};

// In-memory settings (will reset on app restart)
let currentSettings: Settings = { ...defaultSettings };

export function getGpsInterval(): number {
  return currentSettings.gpsIntervalSeconds;
}

export function setGpsInterval(seconds: number): void {
  if (seconds < 1 || seconds > 300) {
    throw new Error('GPS interval must be between 1 and 300 seconds');
  }
  currentSettings.gpsIntervalSeconds = seconds;
}

export function getSettings(): Settings {
  return { ...currentSettings };
}

export function resetSettings(): void {
  currentSettings = { ...defaultSettings };
}
