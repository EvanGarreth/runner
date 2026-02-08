import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as RunNotification from '../../modules/expo-run-notification';

const RUN_NOTIFICATION_ID = 'active-run-notification';
const NOTIFICATION_CHANNEL_ID = 'active-run-channel';

// Action identifiers
export const NOTIFICATION_ACTION_PAUSE = 'pause-run';
export const NOTIFICATION_ACTION_RESUME = 'resume-run';
export const NOTIFICATION_ACTION_STOP = 'stop-run';

// Notification action handlers
type NotificationActionHandler = () => void;

const actionHandlers: Record<string, NotificationActionHandler> = {};

/**
 * Register a handler for notification actions
 */
export function registerNotificationActionHandler(action: string, handler: NotificationActionHandler) {
  actionHandlers[action] = handler;
}

/**
 * Initialize notification handling
 * Call this once when the app starts
 */
export async function initializeRunNotifications() {
  // Set up default notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  // Set up notification categories with actions
  if (Platform.OS === 'android') {
    // For Android, listen to notification action events from custom module
    const subscription = RunNotification.addNotificationActionListener((event) => {
      const handlerMap: Record<string, string> = {
        pause: NOTIFICATION_ACTION_PAUSE,
        resume: NOTIFICATION_ACTION_RESUME,
        stop: NOTIFICATION_ACTION_STOP,
      };

      const actionId = handlerMap[event.action];
      if (actionId) {
        const handler = actionHandlers[actionId];
        if (handler) {
          handler();
        }
      }
    });

    return subscription;
  } else {
    // iOS setup
    await Notifications.setNotificationCategoryAsync('run-active', [
      {
        identifier: NOTIFICATION_ACTION_PAUSE,
        buttonTitle: 'Pause',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: NOTIFICATION_ACTION_STOP,
        buttonTitle: 'Stop',
        options: {
          opensAppToForeground: true,
          isDestructive: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('run-paused', [
      {
        identifier: NOTIFICATION_ACTION_RESUME,
        buttonTitle: 'Resume',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: NOTIFICATION_ACTION_STOP,
        buttonTitle: 'Stop',
        options: {
          opensAppToForeground: true,
          isDestructive: true,
        },
      },
    ]);

    // Listen for notification responses (when user taps an action button)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;

      // Handle default action (tapping the notification itself)
      if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return;
      }

      // Handle custom actions
      const handler = actionHandlers[actionId];
      if (handler) {
        handler();
      }
    });

    return subscription;
  }

  return null;
}

/**
 * Show the active run notification
 */
export async function showRunNotification(
  distance: string,
  time: string,
  pace: string,
  isPaused: boolean,
  progress?: { current: number; max: number; label: string } // Optional progress for timed/distance runs
): Promise<void> {
  try {
    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Notification permission not granted, cannot show notification');
      return;
    }

    const body = `${distance} • ${time} • ${pace}/mi`;

    // Use custom native module for Android to get native progress bar support
    if (Platform.OS === 'android') {
      RunNotification.showRunNotification({
        title: isPaused ? 'Run Paused' : 'Run Active',
        body,
        isPaused,
        progress: progress
          ? {
              current: progress.current,
              max: progress.max,
            }
          : undefined,
      });
      return;
    }

    // Fallback to expo-notifications for iOS
    const content: any = {
      title: isPaused ? 'Run Paused' : 'Run Active',
      body,
      categoryIdentifier: isPaused ? 'run-paused' : 'run-active',
      priority: Notifications.AndroidNotificationPriority.LOW,
      sticky: true,
      autoDismiss: false,
      data: { type: 'active-run' },
    };

    // Cancel any existing scheduled notification with this ID first
    await Notifications.cancelScheduledNotificationAsync(RUN_NOTIFICATION_ID).catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier: RUN_NOTIFICATION_ID,
      content,
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error showing run notification:', error);
  }
}

/**
 * Update the active run notification
 */
export async function updateRunNotification(
  distance: string,
  time: string,
  pace: string,
  isPaused: boolean,
  progress?: { current: number; max: number; label: string }
): Promise<void> {
  await showRunNotification(distance, time, pace, isPaused, progress);
}

/**
 * Dismiss the active run notification
 */
export async function dismissRunNotification(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      RunNotification.dismissRunNotification();
    } else {
      await Notifications.dismissNotificationAsync(RUN_NOTIFICATION_ID);
    }
  } catch (error) {
    console.error('Error dismissing run notification:', error);
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}
