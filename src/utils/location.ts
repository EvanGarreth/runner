import * as Location from 'expo-location';

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
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
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
