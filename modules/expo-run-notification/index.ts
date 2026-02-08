import { requireNativeModule, EventEmitter, Subscription } from 'expo-modules-core';

const RunNotificationModule = requireNativeModule('ExpoRunNotification');
const emitter = new EventEmitter(RunNotificationModule);

export interface RunNotificationOptions {
  title: string;
  body: string;
  isPaused: boolean;
  progress?: {
    current: number;
    max: number;
  };
}

export function showRunNotification(options: RunNotificationOptions): void {
  return RunNotificationModule.showNotification(options);
}

export function dismissRunNotification(): void {
  return RunNotificationModule.dismissNotification();
}

export function addNotificationActionListener(
  listener: (event: { action: string }) => void
): Subscription {
  return emitter.addListener('onNotificationAction', listener);
}
