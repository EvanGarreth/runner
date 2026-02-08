import { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Text, View } from "@/components/Themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import {
  requestLocationPermissions,
  requestBackgroundPermissions,
  getCurrentLocation,
  startForegroundLocationTracking,
  stopForegroundLocationTracking,
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  calculateTotalDistance,
  formatDistance,
  formatTime,
  calculatePace,
  LocationPoint,
} from "@/utils/location";
import { getGpsInterval, getWeatherTrackingEnabled, getUseMetricUnits } from "@/utils/settings";
import { fetchAndSaveWeather } from "@/utils/weather";
import { useSQLiteContext } from "expo-sqlite";
import { useTheme } from "@/contexts/ThemeContext";
import {
  initializeRunNotifications,
  showRunNotification,
  updateRunNotification,
  dismissRunNotification,
  requestNotificationPermissions,
  registerNotificationActionHandler,
  NOTIFICATION_ACTION_PAUSE,
  NOTIFICATION_ACTION_RESUME,
  NOTIFICATION_ACTION_STOP,
} from "@/utils/runNotification";

type RunType = "T" | "D" | "F";

export default function ActiveRun() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const db = useSQLiteContext();
  const { palette } = useTheme();

  const runType = params.type as RunType;
  const targetSeconds = params.targetSeconds ? parseInt(params.targetSeconds as string) : null;
  const targetDistance = params.targetDistance ? parseFloat(params.targetDistance as string) : null;

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [locationPoints, setLocationPoints] = useState<LocationPoint[]>([]);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [gpsIntervalSeconds, setGpsIntervalSeconds] = useState(5);

  const startTime = useRef<number | null>(null);
  const pausedTime = useRef<number>(0);
  const lastPauseStart = useRef<number | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const gpsInterval = useRef<NodeJS.Timeout | null>(null);
  const notificationUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const notificationSubscription = useRef<any>(null);

  const stopTracking = useCallback(async () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (gpsInterval.current) {
      clearInterval(gpsInterval.current);
      gpsInterval.current = null;
    }
    if (notificationUpdateInterval.current) {
      clearInterval(notificationUpdateInterval.current);
      notificationUpdateInterval.current = null;
    }

    // Stop both foreground and background location tracking
    await stopForegroundLocationTracking();
    await stopBackgroundLocationTracking();

    // Dismiss the notification
    await dismissRunNotification();

    setIsRunning(false);
  }, []);

  const saveRun = useCallback(async () => {
    try {
      const startDate = new Date(startTime.current || Date.now()).toISOString();
      const endDate = new Date().toISOString();
      const locationDataJson = JSON.stringify(locationPoints);

      // Insert location data
      const locationResult = await db.runAsync("INSERT INTO locationData (json) VALUES (?)", [locationDataJson]);

      // Insert run
      const runResult = await db.runAsync(
        `INSERT INTO runs (type, start, end, locationDataId, miles, steps, rating, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [runType, startDate, endDate, locationResult.lastInsertRowId, currentDistance, 0, 0, ""]
      );

      const runId = runResult.lastInsertRowId;

      // Fetch and save weather data if enabled (fire-and-forget)
      const weatherEnabled = await getWeatherTrackingEnabled(db);
      const useMetric = await getUseMetricUnits(db);
      if (weatherEnabled && locationPoints.length > 0) {
        const lastPoint = locationPoints[locationPoints.length - 1];
        fetchAndSaveWeather(db, runId, lastPoint.latitude, lastPoint.longitude, new Date(endDate), useMetric).catch(
          console.error
        );
      }

      // Navigate to completion screen with run details
      router.replace(
        `/runs/complete?runId=${runId}&distance=${currentDistance}&time=${elapsedSeconds}&type=${runType}`
      );
    } catch (error) {
      console.error("Error saving run:", error);
      Alert.alert("Error", "Failed to save run. Please try again.");
    }
  }, [locationPoints, db, runType, currentDistance, elapsedSeconds, router]);

  const handleStopRun = useCallback(() => {
    Alert.alert("End Run", "Are you sure you want to end this run?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Run",
        style: "destructive",
        onPress: () => {
          stopTracking();
          saveRun();
        },
      },
    ]);
  }, [stopTracking, saveRun]);

  // Request permissions and start run
  useEffect(() => {
    const initRun = async () => {
      // Initialize notifications
      notificationSubscription.current = await initializeRunNotifications();

      // Request notification permissions
      const notificationGranted = await requestNotificationPermissions();
      if (!notificationGranted) {
        console.log("notification permissions not granted");
      }

      // Load GPS interval from settings
      const interval = await getGpsInterval(db);
      setGpsIntervalSeconds(interval);

      console.log("requesting foreground permissions");
      const granted = await requestLocationPermissions();

      if (!granted) {
        console.log("foreground permissions not granted");
        Alert.alert("Location Permission Required", "Please enable location permissions to track your run.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        setIsLoading(false);
        return;
      }
      console.log("foreground permissions granted");

      // Request background permissions (required on some Android versions for foreground service)
      console.log("requesting background permissions");
      const backgroundGranted = await requestBackgroundPermissions();

      if (!backgroundGranted) {
        console.log("background permissions not granted");
        Alert.alert(
          "Background Location Required",
          "Please enable background location to track your run even when the screen is locked.",
          [{ text: "OK", onPress: () => router.back() }]
        );
        setIsLoading(false);
        return;
      }
      console.log("background permissions granted");

      setPermissionGranted(true);

      // Get initial location
      console.log("get current");
      const initialLocation = await getCurrentLocation();
      console.log("got current");
      if (initialLocation) {
        console.log("inital!");
        setLocationPoints([initialLocation]);
      }

      setIsLoading(false);
      await startRun();
    };

    initRun();

    return () => {
      stopTracking();
      if (notificationSubscription.current) {
        notificationSubscription.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent accidental navigation away from active run
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Allow navigation if not running or if already paused and user is stopping
      if (!isRunning) {
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Show confirmation alert
      Alert.alert(
        "Run in Progress",
        "You have an active run. Are you sure you want to exit? Your run will not be saved.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Exit",
            style: "destructive",
            onPress: () => {
              stopTracking();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isRunning, stopTracking]);

  // Update distance when location points change
  useEffect(() => {
    const distance = calculateTotalDistance(locationPoints);
    setCurrentDistance(distance);

    // Auto-stop for distance runs
    if (runType === "D" && targetDistance && distance >= targetDistance && isRunning) {
      handleStopRun();
    }
  }, [locationPoints, runType, targetDistance, isRunning, handleStopRun]);

  // Auto-stop for timed runs
  useEffect(() => {
    if (runType === "T" && targetSeconds && elapsedSeconds >= targetSeconds && isRunning) {
      handleStopRun();
    }
  }, [elapsedSeconds, runType, targetSeconds, isRunning, handleStopRun]);

  // Update notification periodically
  useEffect(() => {
    if (!isRunning) return;

    // Register notification action handlers
    registerNotificationActionHandler(NOTIFICATION_ACTION_PAUSE, handlePauseResume);
    registerNotificationActionHandler(NOTIFICATION_ACTION_RESUME, handlePauseResume);
    registerNotificationActionHandler(NOTIFICATION_ACTION_STOP, handleStopRun);

    // Calculate progress for notification
    const getNotificationProgress = () => {
      if (runType === "T" && targetSeconds) {
        // Timed run: progress in seconds
        return { current: elapsedSeconds, max: targetSeconds, label: "Time Progress" };
      }
      if (runType === "D" && targetDistance) {
        // Distance run: convert to meters for better granularity (1 mile = 1609.34 meters)
        const currentMeters = Math.round(currentDistance * 1609.34);
        const targetMeters = Math.round(targetDistance * 1609.34);
        return { current: currentMeters, max: targetMeters, label: "Distance Progress" };
      }
      return undefined; // Free run - no progress bar
    };

    // Show initial notification
    const distance = formatDistance(currentDistance);
    const time = formatTime(elapsedSeconds);
    const pace = calculatePace(currentDistance, elapsedSeconds);
    const progress = getNotificationProgress();
    showRunNotification(distance, time, pace, isPaused, progress);

    // Update notification every 5 seconds (less frequent to avoid watch spam)
    notificationUpdateInterval.current = setInterval(() => {
      const distance = formatDistance(currentDistance);
      const time = formatTime(elapsedSeconds);
      const pace = calculatePace(currentDistance, elapsedSeconds);
      const progress = getNotificationProgress();
      updateRunNotification(distance, time, pace, isPaused, progress);
    }, 5000);

    return () => {
      if (notificationUpdateInterval.current) {
        clearInterval(notificationUpdateInterval.current);
        notificationUpdateInterval.current = null;
      }
    };
  }, [isRunning, isPaused, currentDistance, elapsedSeconds, handlePauseResume, handleStopRun, runType, targetSeconds, targetDistance]);

  const startRun = async () => {
    startTime.current = Date.now();
    setIsRunning(true);
    setIsPaused(false);

    // Start timer
    timerInterval.current = setInterval(() => {
      if (startTime.current && !lastPauseStart.current) {
        const elapsed = Math.floor((Date.now() - startTime.current - pausedTime.current) / 1000);
        setElapsedSeconds(elapsed);
      }
    }, 100);

    // Start foreground GPS tracking (works even when screen is locked)
    const trackingStarted = await startForegroundLocationTracking((locations) => {
      setLocationPoints((prev) => [...prev, ...locations]);
    });

    if (!trackingStarted) {
      console.error("Failed to start foreground location tracking");
      Alert.alert("GPS Error", "Failed to start location tracking. Please try again.");
      stopTracking();
    }
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      // Resume
      if (lastPauseStart.current) {
        pausedTime.current += Date.now() - lastPauseStart.current;
        lastPauseStart.current = null;
      }
      setIsPaused(false);

      // Resume foreground GPS tracking
      const trackingStarted = await startForegroundLocationTracking((locations) => {
        setLocationPoints((prev) => [...prev, ...locations]);
      });

      if (!trackingStarted) {
        console.error("Failed to resume foreground location tracking");
        Alert.alert("GPS Error", "Failed to resume location tracking.");
      }
    } else {
      // Pause
      lastPauseStart.current = Date.now();
      setIsPaused(true);

      // Stop foreground GPS tracking
      await stopForegroundLocationTracking();

      // Clear interval refs if any
      if (gpsInterval.current) {
        clearInterval(gpsInterval.current);
        gpsInterval.current = null;
      }
    }
  };

  const getRemainingTime = () => {
    if (runType === "T" && targetSeconds) {
      return Math.max(0, targetSeconds - elapsedSeconds);
    }
    return elapsedSeconds;
  };

  const getRemainingDistance = () => {
    if (runType === "D" && targetDistance) {
      return Math.max(0, targetDistance - currentDistance);
    }
    return currentDistance;
  };

  const getProgress = () => {
    if (runType === "T" && targetSeconds) {
      return Math.min(1, elapsedSeconds / targetSeconds);
    }
    if (runType === "D" && targetDistance) {
      return Math.min(1, currentDistance / targetDistance);
    }
    return 0;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    runTypeText: {
      fontSize: 24,
      fontWeight: "bold",
    },
    pausedText: {
      fontSize: 18,
      color: "#FF9800",
      fontWeight: "bold",
      marginTop: 10,
    },
    statsContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    mainStat: {
      alignItems: "center",
      marginBottom: 30,
    },
    mainStatValue: {
      fontSize: 60,
      fontWeight: "bold",
      fontFamily: "monospace",
    },
    mainStatLabel: {
      fontSize: 18,
      color: palette.textMuted,
      marginTop: 5,
    },
    secondaryStat: {
      alignItems: "center",
      marginBottom: 20,
    },
    secondaryStatValue: {
      fontSize: 32,
      fontWeight: "600",
    },
    secondaryStatLabel: {
      fontSize: 14,
      color: palette.textMuted,
      marginTop: 5,
    },
    progressBar: {
      width: "100%",
      height: 10,
      backgroundColor: "#e0e0e0",
      borderRadius: 5,
      overflow: "hidden",
      marginTop: 20,
    },
    progressFill: {
      height: "100%",
      backgroundColor: palette.primary,
    },
    controls: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 20,
      marginBottom: 30,
    },
    pauseButton: {
      backgroundColor: "#FF9800",
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 10,
    },
    stopButton: {
      backgroundColor: "#f44336",
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 10,
    },
    buttonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
    infoContainer: {
      alignItems: "center",
    },
    infoText: {
      fontSize: 12,
      color: palette.textMuted,
      marginBottom: 5,
    },
    loadingText: {
      marginTop: 20,
      fontSize: 16,
    },
    errorText: {
      fontSize: 18,
      color: "#f44336",
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Initializing GPS...</Text>
      </View>
    );
  }

  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Location permission required</Text>
      </View>
    );
  }

  const displayTime = runType === "T" ? getRemainingTime() : elapsedSeconds;
  const displayDistance = runType === "D" ? getRemainingDistance() : currentDistance;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.runTypeText}>
          {runType === "T" ? "Timed Run" : runType === "D" ? "Distance Run" : "Free Run"}
        </Text>
        {isPaused && <Text style={styles.pausedText}>PAUSED</Text>}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.mainStat}>
          <Text style={styles.mainStatValue}>{formatTime(displayTime)}</Text>
          <Text style={styles.mainStatLabel}>{runType === "T" ? "Remaining" : "Time"}</Text>
        </View>

        <View style={styles.secondaryStat}>
          <Text style={styles.secondaryStatValue}>{formatDistance(displayDistance)}</Text>
          <Text style={styles.secondaryStatLabel}>{runType === "D" ? "Remaining" : "Distance"}</Text>
        </View>

        <View style={styles.secondaryStat}>
          <Text style={styles.secondaryStatValue}>{calculatePace(currentDistance, elapsedSeconds)}</Text>
          <Text style={styles.secondaryStatLabel}>Pace (min/mi)</Text>
        </View>

        {(runType === "T" || runType === "D") && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.pauseButton} onPress={handlePauseResume}>
          <Text style={styles.buttonText}>{isPaused ? "Resume" : "Pause"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stopButton} onPress={handleStopRun}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>GPS Points: {locationPoints.length}</Text>
        <Text style={styles.infoText}>GPS Interval: {gpsIntervalSeconds}s</Text>
      </View>
    </View>
  );
}
