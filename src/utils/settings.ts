/**
 * User settings and preferences
 * Persisted to SQLite database
 */

import { SQLiteDatabase } from 'expo-sqlite';

export interface Settings {
  gpsIntervalSeconds: number;
  weatherTrackingEnabled: boolean;
  useMetricUnits: boolean;
}

// Default settings
const defaultSettings: Settings = {
  gpsIntervalSeconds: 5,
  weatherTrackingEnabled: false,
  useMetricUnits: false,
};

/**
 * Initialize settings table with defaults if missing
 */
export async function initializeSettings(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(`INSERT OR IGNORE INTO settings (key, value) VALUES ('gpsIntervalSeconds', '5')`);
  await db.runAsync(`INSERT OR IGNORE INTO settings (key, value) VALUES ('weatherTrackingEnabled', 'false')`);
  await db.runAsync(`INSERT OR IGNORE INTO settings (key, value) VALUES ('useMetricUnits', 'false')`);
}

/**
 * Get GPS tracking interval in seconds
 */
export async function getGpsInterval(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'gpsIntervalSeconds'`
  );
  if (!result) {
    return defaultSettings.gpsIntervalSeconds;
  }
  return parseInt(result.value, 10);
}

/**
 * Set GPS tracking interval in seconds
 */
export async function setGpsInterval(db: SQLiteDatabase, seconds: number): Promise<void> {
  if (seconds < 1 || seconds > 300) {
    throw new Error('GPS interval must be between 1 and 300 seconds');
  }
  await db.runAsync(`INSERT OR REPLACE INTO settings (key, value) VALUES ('gpsIntervalSeconds', ?)`, [
    seconds.toString(),
  ]);
}

/**
 * Get weather tracking enabled status
 */
export async function getWeatherTrackingEnabled(db: SQLiteDatabase): Promise<boolean> {
  const result = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'weatherTrackingEnabled'`
  );
  if (!result) {
    return defaultSettings.weatherTrackingEnabled;
  }
  return result.value === 'true';
}

/**
 * Set weather tracking enabled status
 */
export async function setWeatherTrackingEnabled(db: SQLiteDatabase, enabled: boolean): Promise<void> {
  await db.runAsync(`INSERT OR REPLACE INTO settings (key, value) VALUES ('weatherTrackingEnabled', ?)`, [
    enabled.toString(),
  ]);
}

/**
 * Get metric units preference
 */
export async function getUseMetricUnits(db: SQLiteDatabase): Promise<boolean> {
  const result = await db.getFirstAsync<{ value: string }>(`SELECT value FROM settings WHERE key = 'useMetricUnits'`);
  if (!result) {
    return defaultSettings.useMetricUnits;
  }
  return result.value === 'true';
}

/**
 * Set metric units preference
 */
export async function setUseMetricUnits(db: SQLiteDatabase, enabled: boolean): Promise<void> {
  await db.runAsync(`INSERT OR REPLACE INTO settings (key, value) VALUES ('useMetricUnits', ?)`, [enabled.toString()]);
}

/**
 * Get all settings
 */
export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const gpsInterval = await getGpsInterval(db);
  const weatherTracking = await getWeatherTrackingEnabled(db);
  const useMetric = await getUseMetricUnits(db);

  return {
    gpsIntervalSeconds: gpsInterval,
    weatherTrackingEnabled: weatherTracking,
    useMetricUnits: useMetric,
  };
}
