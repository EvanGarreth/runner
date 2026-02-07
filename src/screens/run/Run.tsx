import { StyleSheet, ScrollView, ActivityIndicator, Platform } from "react-native";
import { Text, View } from "@/components/Themed";
import { useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { formatDistance, formatTime, calculatePace } from "@/utils/location";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { GoogleMaps, AppleMaps } from "expo-maps";

interface RunData {
  id: number;
  type: string;
  start: string;
  end: string;
  miles: number;
  steps: number;
  rating: number;
  note: string;
  locationDataId: number;
  weatherId: number | null;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface WeatherData {
  id: number;
  date: string;
  temperature: number;
  precipitation: string | null;
  windSpeed: number | null;
  windDirection: string | null;
  humidity: number | null;
  uvIndex: number | null;
}

export default function Run() {
  const params = useLocalSearchParams();
  const db = useSQLiteContext();
  const [run, setRun] = useState<RunData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const loadRun = async () => {
      try {
        const result = await db.getFirstAsync<RunData>(
          "SELECT id, type, start, end, miles, steps, rating, note, locationDataId, weatherId FROM runs WHERE id = ?",
          [params.id]
        );
        setRun(result || null);
      } catch (error) {
        console.error("Error loading run:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRun();
  }, [params.id, db]);

  useEffect(() => {
    const loadLocationData = async () => {
      if (run?.locationDataId) {
        try {
          const locationData = await db.getFirstAsync<{ json: string }>("SELECT json FROM locationData WHERE id = ?", [
            run.locationDataId,
          ]);
          if (locationData?.json) {
            const coords = JSON.parse(locationData.json);
            setCoordinates(coords);
          }
        } catch (error) {
          console.error("Error loading location data:", error);
        }
      }
    };

    loadLocationData();
  }, [run, db]);

  useEffect(() => {
    const loadWeather = async () => {
      if (run?.weatherId) {
        try {
          const weatherData = await db.getFirstAsync<WeatherData>(
            "SELECT id, date, temperature, precipitation, windSpeed, windDirection, humidity, uvIndex FROM weather WHERE id = ?",
            [run.weatherId]
          );
          setWeather(weatherData || null);
        } catch (error) {
          console.error("Error loading weather data:", error);
        }
      }
    };

    loadWeather();
  }, [run, db]);

  const getRunTypeName = (type: string) => {
    switch (type) {
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

  const getTemperatureUnit = (temp: number) => {
    // Heuristic: if temp is > 50, it's likely Fahrenheit, otherwise Celsius
    // This is a simple approach since we're storing the data in the unit it was fetched in
    return temp > 50 ? "°F" : "°C";
  };

  const getWindSpeedUnit = (temp: number) => {
    // Use same heuristic as temperature
    return temp > 50 ? "mph" : "km/h";
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!run) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Run not found</Text>
      </View>
    );
  }

  const start = new Date(run.start);
  const end = new Date(run.end);
  const duration = (end.getTime() - start.getTime()) / 1000;
  const pace = calculatePace(run.miles, duration);

  const getMapCenter = () => {
    if (coordinates.length === 0) return null;

    const latitudes = coordinates.map((coord) => coord.latitude);
    const longitudes = coordinates.map((coord) => coord.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
    };
  };

  const mapCenter = getMapCenter();

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>{getRunTypeName(run.type)}</Text>
        <Text style={styles.date}>
          {start.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </Text>
        <Text style={styles.time}>
          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>

        <View style={styles.ratingContainer}>
          {[...Array(run.rating)].map((_, i) => (
            <FontAwesome key={i} name="star" size={24} color="#FFD700" />
          ))}
        </View>

        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

        {coordinates.length > 0 && mapCenter && (
          <>
            <View style={styles.mapContainer}>
              {Platform.OS === "ios" ? (
                <AppleMaps.View
                  style={styles.map}
                  cameraPosition={{ coordinates: mapCenter, zoom: 15 }}
                  polylines={[{ coordinates: coordinates, color: "#4CAF50", width: 4 }]}
                  markers={[
                    { coordinates: coordinates[0], title: "Start", tintColor: "#00C853" },
                    {
                      coordinates: coordinates[coordinates.length - 1],
                      title: "Finish",
                      tintColor: "#FF1744",
                    },
                  ]}
                />
              ) : (
                <GoogleMaps.View
                  style={styles.map}
                  cameraPosition={{ coordinates: mapCenter, zoom: 15 }}
                  polylines={[{ coordinates: coordinates, color: "#4CAF50", width: 4 }]}
                  markers={[
                    { coordinates: coordinates[0], title: "Start" },
                    {
                      coordinates: coordinates[coordinates.length - 1],
                      title: "Finish",
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
          </>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <FontAwesome name="road" size={28} color="#4CAF50" style={styles.statIcon} />
            <Text style={styles.statValue}>{formatDistance(run.miles)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome name="clock-o" size={28} color="#2196F3" style={styles.statIcon} />
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome name="tachometer" size={28} color="#FF9800" style={styles.statIcon} />
            <Text style={styles.statValue}>{pace}</Text>
            <Text style={styles.statLabel}>Pace (min/mi)</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome name="heartbeat" size={28} color="#E91E63" style={styles.statIcon} />
            <Text style={styles.statValue}>{run.type}</Text>
            <Text style={styles.statLabel}>Run Type</Text>
          </View>
        </View>

        {weather && (
          <>
            <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
            <View style={styles.weatherSection}>
              <Text style={styles.weatherTitle}>Weather Conditions</Text>
              <View style={styles.weatherGrid}>
                <View style={styles.weatherCard}>
                  <FontAwesome name="thermometer-half" size={24} color="#FF5722" style={styles.weatherIcon} />
                  <Text style={styles.weatherValue}>
                    {weather.temperature.toFixed(1)}
                    {getTemperatureUnit(weather.temperature)}
                  </Text>
                  <Text style={styles.weatherLabel}>Temperature</Text>
                </View>

                {weather.humidity !== null && (
                  <View style={styles.weatherCard}>
                    <FontAwesome name="tint" size={24} color="#2196F3" style={styles.weatherIcon} />
                    <Text style={styles.weatherValue}>{weather.humidity.toFixed(0)}%</Text>
                    <Text style={styles.weatherLabel}>Humidity</Text>
                  </View>
                )}

                {weather.windSpeed !== null && weather.windDirection && (
                  <View style={styles.weatherCard}>
                    <FontAwesome name="flag" size={24} color="#009688" style={styles.weatherIcon} />
                    <Text style={styles.weatherValue}>
                      {weather.windSpeed.toFixed(1)} {getWindSpeedUnit(weather.temperature)}
                    </Text>
                    <Text style={styles.weatherLabel}>Wind ({weather.windDirection})</Text>
                  </View>
                )}

                {weather.uvIndex !== null && weather.uvIndex > 0 && (
                  <View style={styles.weatherCard}>
                    <FontAwesome name="sun-o" size={24} color="#FFC107" style={styles.weatherIcon} />
                    <Text style={styles.weatherValue}>{weather.uvIndex}</Text>
                    <Text style={styles.weatherLabel}>UV Index</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {run.note && run.note.length > 0 && (
          <>
            <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Notes</Text>
              <View style={styles.notesCard}>
                <Text style={styles.notesText}>{run.note}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  date: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  time: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
  },
  separator: {
    marginVertical: 24,
    height: 1,
    width: "100%",
  },
  mapContainer: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  statCard: {
    width: "48%",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 12,
    alignItems: "center",
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  weatherSection: {
    width: "100%",
  },
  weatherTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  weatherGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  weatherCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 12,
    alignItems: "center",
  },
  weatherIcon: {
    marginBottom: 8,
  },
  weatherValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  weatherLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  notesSection: {
    width: "100%",
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  notesCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  errorText: {
    fontSize: 18,
    color: "#f44336",
    textAlign: "center",
  },
});
