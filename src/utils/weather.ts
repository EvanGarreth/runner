/**
 * Weather data integration with Open-Meteo API
 */

import { SQLiteDatabase } from 'expo-sqlite';

// Open-Meteo API response structure
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    uv_index: number[];
  };
  hourly_units: {
    temperature_2m: string;
    wind_speed_10m: string;
  };
}

// Internal weather data structure
export interface WeatherData {
  date: Date;
  temperature: number;
  precipitation: 'M' | 'L' | 'H' | 'ST' | 'SN' | null;
  windSpeed: number | null;
  windDirection: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | null;
  humidity: number | null;
  uvIndex: number | null;
}

/**
 * Map precipitation in mm to enum based on temperature
 * M = Minimal, L = Light, H = Heavy, ST = Storm, SN = Snow
 */
function mapPrecipitationToEnum(mm: number, tempCelsius: number): 'M' | 'L' | 'H' | 'ST' | 'SN' | null {
  if (mm === 0) {
    return 'M';
  }

  // Snow if below freezing
  if (tempCelsius < 0) {
    return 'SN';
  }

  // Precipitation categories (per hour)
  if (mm < 2.5) {
    return 'L'; // Light rain
  } else if (mm < 10) {
    return 'H'; // Heavy rain
  } else {
    return 'ST'; // Storm
  }
}

/**
 * Map wind direction in degrees to cardinal direction
 */
function mapWindDirectionToCardinal(degrees: number): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' {
  const directions: ('N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW')[] = [
    'N',
    'NE',
    'E',
    'SE',
    'S',
    'SW',
    'W',
    'NW',
  ];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Find the index of the closest hour in the API response
 */
function findClosestHourIndex(times: string[], targetTime: Date): number {
  const targetTimestamp = targetTime.getTime();
  let closestIndex = 0;
  let closestDiff = Math.abs(new Date(times[0]).getTime() - targetTimestamp);

  for (let i = 1; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - targetTimestamp);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Fetch weather data from Open-Meteo API
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  timestamp: Date,
  useMetricUnits: boolean
): Promise<WeatherData> {
  // Open-Meteo API endpoint
  const tempUnit = useMetricUnits ? 'celsius' : 'fahrenheit';
  const windSpeedUnit = useMetricUnits ? 'kmh' : 'mph';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,uv_index&temperature_unit=${tempUnit}&wind_speed_unit=${windSpeedUnit}&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API request failed: ${response.statusText}`);
  }

  const data: OpenMeteoResponse = await response.json();

  // Find the closest hour to the run end time
  const hourIndex = findClosestHourIndex(data.hourly.time, timestamp);

  // Extract data for that hour
  const temperature = data.hourly.temperature_2m[hourIndex];
  const humidity = data.hourly.relative_humidity_2m[hourIndex];
  const precipitationMm = data.hourly.precipitation[hourIndex];
  const windSpeed = data.hourly.wind_speed_10m[hourIndex];
  const windDegrees = data.hourly.wind_direction_10m[hourIndex];
  const uvIndex = data.hourly.uv_index[hourIndex];

  // Convert temperature to Celsius for precipitation calculation if using imperial
  const tempForPrecip = useMetricUnits ? temperature : ((temperature - 32) * 5) / 9;

  return {
    date: new Date(data.hourly.time[hourIndex]),
    temperature,
    precipitation: mapPrecipitationToEnum(precipitationMm, tempForPrecip),
    windSpeed: windSpeed ?? null,
    windDirection: windDegrees !== undefined ? mapWindDirectionToCardinal(windDegrees) : null,
    humidity: humidity ?? null,
    uvIndex: uvIndex !== undefined ? Math.round(uvIndex) : null,
  };
}

/**
 * Save weather data to database
 */
export async function saveWeatherToDatabase(db: SQLiteDatabase, weatherData: WeatherData): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO weather (date, temperature, precipitation, windSpeed, windDirection, humidity, uvIndex)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      weatherData.date.toISOString(),
      weatherData.temperature,
      weatherData.precipitation,
      weatherData.windSpeed,
      weatherData.windDirection,
      weatherData.humidity,
      weatherData.uvIndex,
    ]
  );

  return result.lastInsertRowId;
}

/**
 * Fetch weather data and save to database, then update run's weatherId
 * This is a fire-and-forget operation - errors are caught silently
 */
export async function fetchAndSaveWeather(
  db: SQLiteDatabase,
  runId: number,
  latitude: number,
  longitude: number,
  endTime: Date,
  useMetricUnits: boolean
): Promise<void> {
  try {
    // Fetch weather data from API
    const weatherData = await fetchWeatherData(latitude, longitude, endTime, useMetricUnits);

    // Save to database
    const weatherId = await saveWeatherToDatabase(db, weatherData);

    // Update run's weatherId
    await db.runAsync(`UPDATE runs SET weatherId = ? WHERE id = ?`, [weatherId, runId]);
  } catch (error) {
    // Silently catch all errors - weather should never block run completion
    console.error('Failed to fetch/save weather data:', error);
  }
}
