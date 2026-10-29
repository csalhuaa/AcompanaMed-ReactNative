import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export class HapticService {
  async vibrateSuccess(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }

  async vibrateWarning(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  }

  async vibrateSOS(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
  }
}

export const defaultHapticService = new HapticService();
