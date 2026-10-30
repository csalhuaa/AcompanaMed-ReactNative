import { Linking, Alert } from 'react-native';
import {
  formatWhatsAppNumber,
  buildWhatsAppUrl,
  buildPhoneCallUrl,
} from '../domain/communicationEngines';

export class CommunicationService {
  static formatWhatsAppNumber = formatWhatsAppNumber;
  static buildWhatsAppUrl = buildWhatsAppUrl;
  static buildPhoneCallUrl = buildPhoneCallUrl;

  static async openWhatsApp(phone: string, message: string): Promise<boolean> {
    try {
      const url = buildWhatsAppUrl(phone, message);
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.warn('CommunicationService openWhatsApp error:', error);
      Alert.alert(
        'WhatsApp no disponible',
        `No fue posible abrir WhatsApp directamente. Número de contacto: ${phone}`
      );
      return false;
    }
  }

  static async makePhoneCall(phone: string): Promise<boolean> {
    try {
      const url = buildPhoneCallUrl(phone);
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.warn('CommunicationService makePhoneCall error:', error);
      Alert.alert(
        'Marcador no disponible',
        `No se pudo iniciar la llamada directa. Número: ${phone}`
      );
      return false;
    }
  }
}
