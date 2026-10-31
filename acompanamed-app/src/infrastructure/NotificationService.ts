import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medicine } from '../domain/types';
import { buildEscalationNotificationPayload } from './SpeechNotificationEngines';
import { ReminderScheduler, type ReminderAdapter } from './ReminderScheduler';

const CHANNEL_ID = 'medication-reminders';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
}

async function nativePermission(request: boolean): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios de medicamentos',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || !request || !existing.canAskAgain) return existing.granted;
  return (await Notifications.requestPermissionsAsync()).granted;
}

const nativeAdapter: ReminderAdapter = {
  // Browsers cannot reliably schedule local alarms after the tab closes.
  supported: Platform.OS !== 'web',
  permission: nativePermission,
  list: async () => (await Notifications.getAllScheduledNotificationsAsync()).map((request) => ({
    identifier: request.identifier,
    content: { data: request.content.data ?? {} },
  })),
  cancel: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),
  schedule: (request) => Notifications.scheduleNotificationAsync({
    identifier: request.identifier,
    content: {
      title: request.content.title,
      body: request.content.body,
      sound: true,
      data: request.content.data,
    },
    trigger: request.trigger.type === 'daily'
      ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: request.trigger.hour, minute: request.trigger.minute, channelId: CHANNEL_ID }
      : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: request.trigger.date, channelId: CHANNEL_ID },
  }),
};

export class NotificationService extends ReminderScheduler {
  constructor(adapter: ReminderAdapter = nativeAdapter) { super(adapter); }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') return await nativePermission(true);
      if (typeof window === 'undefined' || !('Notification' in window)) return false;
      if (window.Notification.permission === 'granted') return true;
      if (window.Notification.permission === 'denied') return false;
      return await window.Notification.requestPermission() === 'granted';
    } catch { return false; }
  }

  async triggerImmediateTestNotification(title: string, body: string): Promise<boolean> {
    if (!await this.requestPermissions()) return false;
    try {
      if (Platform.OS === 'web') {
        new window.Notification(title, { body, icon: '/favicon.ico' });
      } else {
        await Notifications.scheduleNotificationAsync({ content: { title, body, sound: true }, trigger: null });
      }
      return true;
    } catch { return false; }
  }

  async triggerEscalationAlert(patientName: string, medicine: Medicine, time: string, graceMinutes = 30): Promise<string | null> {
    if (!await this.requestPermissions()) return null;
    const payload = buildEscalationNotificationPayload(patientName, medicine, time, graceMinutes);
    try {
      if (Platform.OS === 'web') {
        new window.Notification(payload.title, { body: payload.body, icon: '/favicon.ico' });
        return `web-escalation-${medicine.id}`;
      }
      return await Notifications.scheduleNotificationAsync({
        content: { title: payload.title, body: payload.body, sound: true, data: payload.data }, trigger: null,
      });
    } catch { return null; }
  }

  async cancelAllNotifications(): Promise<void> {
    if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export const defaultNotificationService = new NotificationService();
