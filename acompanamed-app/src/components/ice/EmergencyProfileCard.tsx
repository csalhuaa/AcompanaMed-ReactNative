import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmergencyProfile } from '../../domain';

interface Props {
  emergencyProfile: EmergencyProfile;
  familyCode?: string;
  onCallEmergency: (phone: string, name: string) => void;
  onOpenFamilyPairing?: () => void;
}

export const EmergencyProfileCard: React.FC<Props> = ({
  emergencyProfile,
  familyCode,
  onCallEmergency,
  onOpenFamilyPairing,
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.panelCard}>
        {/* Cabecera ICE con Tipo de Sangre */}
        <View style={styles.headerCardRow}>
          <View style={styles.bloodTypeBadge}>
            <Text style={styles.bloodTypeLabel}>GRUPO</Text>
            <Text style={styles.bloodTypeValue}>{emergencyProfile.bloodType || '—'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{emergencyProfile.patientFullName}</Text>
            <Text style={styles.patientMeta}>
              {emergencyProfile.age ? `${emergencyProfile.age} años` : 'Edad no registrada'} • {emergencyProfile.healthInsurance || 'Seguro no registrado'}
            </Text>
          </View>
          {onOpenFamilyPairing && (
            <TouchableOpacity
              style={styles.btnEditHeader}
              onPress={onOpenFamilyPairing}
              accessibilityLabel="Editar ficha y vincular familia"
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color="#0284C7" />
            </TouchableOpacity>
          )}
        </View>

        {/* Alerta de Alergias Severas */}
        <View style={styles.allergySevereCard}>
          <MaterialCommunityIcons name="alert-octagon" size={24} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.allergySevereTitle}>
              Alergias registradas:
            </Text>
            <Text style={styles.allergySevereList}>
              {(emergencyProfile?.allergies || []).join(' • ') || 'Sin información registrada. Complete su ficha.'}
            </Text>
          </View>
        </View>

        {/* Condiciones Médicas Crónicas */}
        <View style={styles.chronicBox}>
          <Text style={styles.chronicBoxTitle}>Condiciones Médicas Crónicas:</Text>
          {(emergencyProfile?.chronicConditions || []).map((cond, idx) => (
            <Text key={idx} style={styles.chronicItem}>
              • {cond}
            </Text>
          ))}
          {(!emergencyProfile?.chronicConditions || emergencyProfile.chronicConditions.length === 0) && (
            <Text style={styles.chronicItem}>Sin información registrada.</Text>
          )}
        </View>

        {/* Contacto de Auxilio Inmediato */}
        <View style={styles.contactBox}>
          <Text style={styles.contactBoxHeader}>CONTACTO DE AUXILIO INMEDIATO</Text>
          <Text style={styles.contactName}>
            {emergencyProfile?.emergencyContact?.name || 'Configure un contacto en Ajustes y Perfil'}
          </Text>
          <Text style={styles.contactRelation}>
            {emergencyProfile?.emergencyContact?.relationship || ''}
          </Text>

          <TouchableOpacity
            style={styles.btnCall}
            onPress={() =>
              onCallEmergency(
                emergencyProfile?.emergencyContact?.phone || '',
                emergencyProfile?.emergencyContact?.name || 'Contacto'
              )
            }
            activeOpacity={0.85}
            disabled={!emergencyProfile?.emergencyContact?.phone}
            accessibilityState={{ disabled: !emergencyProfile?.emergencyContact?.phone }}
            accessibilityRole="button"
            accessibilityLabel={`Llamar de emergencia a ${emergencyProfile?.emergencyContact?.name || 'contacto'} al ${emergencyProfile?.emergencyContact?.phone || ''}`}
            accessibilityHint="Marca el teléfono del contacto de auxilio inmediato"
          >
            <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
            <Text style={styles.btnCallText}>
              {emergencyProfile?.emergencyContact?.phone ? `Llamar a ${emergencyProfile.emergencyContact.phone}` : 'Falta registrar un teléfono'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Carnet de Respaldo y Recuperación Familiar */}
        {familyCode ? (
          <View style={styles.backupCardBox}>
            <View style={styles.backupHeaderRow}>
              <MaterialCommunityIcons name="shield-key-outline" size={18} color="#0284C7" />
              <Text style={styles.backupTitle}>CARNET DE RESPALDO Y RECUPERACIÓN</Text>
            </View>
            <Text style={styles.backupDesc}>
              Si cambia de teléfono, formatea el equipo o borra la aplicación, ingrese este código en la pantalla inicial para restaurar todo su botiquín al instante:
            </Text>
            <View style={styles.codePillRow}>
              <Text style={styles.codePillText}>{familyCode}</Text>
              {onOpenFamilyPairing && (
                <TouchableOpacity
                  style={styles.btnShowPairingQr}
                  onPress={onOpenFamilyPairing}
                  activeOpacity={0.8}
                  accessibilityLabel="Ver código QR de vinculación familiar"
                >
                  <MaterialCommunityIcons name="qrcode" size={16} color="#0284C7" />
                  <Text style={styles.btnShowPairingQrText}>Ver QR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 84,
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  btnEditHeader: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignSelf: 'center',
  },
  headerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bloodTypeBadge: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#991B1B',
  },
  bloodTypeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#991B1B',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientMeta: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  allergySevereCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  allergySevereTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  allergySevereList: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F1D1D',
    marginTop: 2,
  },
  chronicBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chronicBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  chronicItem: {
    fontSize: 13,
    color: '#0F172A',
  },
  contactBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  contactBoxHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactRelation: {
    fontSize: 12,
    color: '#334155',
  },
  btnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    minHeight: 50,
    borderRadius: 6,
    gap: 8,
    marginTop: 8,
  },
  btnCallText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backupCardBox: {
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
    marginTop: 4,
  },
  backupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  backupDesc: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 16,
  },
  codePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7DD3FC',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  codePillText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  btnShowPairingQr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  btnShowPairingQrText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
});
