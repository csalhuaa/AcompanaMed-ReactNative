import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pairingStyles as styles } from './pairingStyles';

interface Props {
  onTestNotification: () => void;
}

export const NotificationDiagnosticSection: React.FC<Props> = ({ onTestNotification }) => {
  return (
    <View style={[styles.sectionBox, { marginBottom: 12 }]}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="bell-ring" size={20} color="#059669" />
        <Text style={styles.sectionTitle}>4. Diagnóstico de Notificaciones</Text>
      </View>

      <Text style={styles.sectionDesc}>
        Compruebe si el sistema operativo (Android o navegador Web en Windows) tiene habilitados los permisos para emitir alertas sonoras y banners de recordatorio.
      </Text>

      <TouchableOpacity style={styles.btnTestNotification} onPress={onTestNotification} activeOpacity={0.85}>
        <MaterialCommunityIcons name="bell-check-outline" size={18} color="#FFFFFF" />
        <Text style={styles.btnTestNotificationText}>
          Disparar notificación de prueba
        </Text>
      </TouchableOpacity>
    </View>
  );
};
