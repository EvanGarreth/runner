import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number | null;
}

/**
 * Request location permissions from the user
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    // First check if we already have permission
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
    }

    // Only request if we don't already have permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
}

/**
 * Get the current location
 */
export async function getCurrentLocation(): Promise<LocationPoint | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
  const R = 3958.8; // Earth's radius in miles
  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate total distance from an array of location points
 * Returns distance in miles
 */
export function calculateTotalDistance(points: LocationPoint[]): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i - 1], points[i]);
  }

  return totalDistance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return `${(miles * 5280).toFixed(0)} ft`;
  }
  return `${miles.toFixed(2)} mi`;
}

/**
 * Format time for display (seconds to MM:SS or HH:MM:SS)
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate pace (minutes per mile)
 */
export function calculatePace(miles: number, seconds: number): string {
  if (miles === 0) return '--:--';
  const paceSeconds = seconds / miles;
  const minutes = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Location update callback type
type LocationUpdateCallback = (locations: LocationPoint[]) => void;

// Store the callback for location updates
let locationUpdateCallback: LocationUpdateCallback | null = null;

/**
 * Define the background location task
 * This runs even when the app is backgrounded or screen is locked
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;

    // Convert to our LocationPoint format
    const locationPoints: LocationPoint[] = locations.map((loc: any) => ({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      timestamp: loc.timestamp,
      accuracy: loc.coords.accuracy,
    }));

    // Call the callback if set
    if (locationUpdateCallback) {
      locationUpdateCallback(locationPoints);
    }
  }
});

/**
 * Request background location permissions
 * Must be called after foreground permissions are granted
 */
export async function requestBackgroundPermissions(): Promise<boolean> {
  try {
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      console.error('Foreground permissions must be granted first');
      return false;
    }

    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting background permissions:', error);
    return false;
  }
}

/**
 * Start background location tracking
 * @param callback - Function to call when location updates are received
 */
export async function startBackgroundLocationTracking(callback: LocationUpdateCallback): Promise<boolean> {
  try {
    // Check if we have background permissions
    const { status } = await Location.getBackgroundPermissionsAsync();

    if (status !== 'granted') {
      console.error('Background location permission not granted');
      return false;
    }

    // Store the callback
    locationUpdateCallback = callback;

    // Check if task is already running
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      console.log('Background location task already running');
      return true;
    }

    // Start location updates
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000, // Update every second
      distanceInterval: 5, // Or every 5 meters
      foregroundService: {
        notificationTitle: 'Runner Active',
        notificationBody: 'Tracking your run',
        notificationColor: '#FF0000',
      },
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.Fitness,
      showsBackgroundLocationIndicator: true,
    });

    console.log('Background location tracking started');
    return true;
  } catch (error) {
    console.error('Error starting background location tracking:', error);
    return false;
  }
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundLocationTracking(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('Background location tracking stopped');
    }

    // Clear the callback
    locationUpdateCallback = null;
  } catch (error) {
    console.error('Error stopping background location tracking:', error);
  }
}

/**
 * Check if background location tracking is currently active
 */
export async function isBackgroundTrackingActive(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  } catch (error) {
    console.error('Error checking background tracking status:', error);
    return false;
  }
}
