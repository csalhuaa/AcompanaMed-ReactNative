import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medicine } from '../domain/types';
import {
  buildDoseNotificationPayload,
  buildEscalationNotificationPayload,
} from './SpeechNotificationEngines';

// Configurar el handler de presentación de notificaciones en primer plano
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

export class NotificationService {
  private hasPermissions = false;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      this.hasPermissions = finalStatus === 'granted';
      return this.hasPermissions;
    } catch {
      return false;
    }
  }

  async scheduleDoseReminder(medicine: Medicine, timeStr: string): Promise<string | null> {
    const payload = buildDoseNotificationPayload(medicine, timeStr);
    if (Platform.OS === 'web') {
      return `web-notif-${medicine.id}-${timeStr}`;
    }

    try {
      await this.requestPermissions();
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          sound: true,
          data: payload.data,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5, // Notificación inmediata de demostración o programada
        },
      });
      return id;
    } catch (err) {
      console.warn('Error programando notificación:', err);
      return null;
    }
  }

  async triggerEscalationAlert(
    patientName: string,
    medicine: Medicine,
    timeStr: string,
    graceMinutes: number = 30
  ): Promise<string | null> {
    const payload = buildEscalationNotificationPayload(patientName, medicine, timeStr, graceMinutes);
    if (Platform.OS === 'web') {
      return `web-escalation-${medicine.id}`;
    }

    try {
      await this.requestPermissions();
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          sound: true,
          data: payload.data,
        },
        trigger: null, // Disparo inmediato
      });
      return id;
    } catch (err) {
      console.warn('Error disparando alerta de escalamiento:', err);
      return null;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
  }
}

export const defaultNotificationService = new NotificationService();
