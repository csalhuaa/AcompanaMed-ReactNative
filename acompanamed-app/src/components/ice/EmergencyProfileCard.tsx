import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmergencyProfile } from '../../domain';
import { CommunicationService } from '../../infrastructure/CommunicationService';

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
  const contact = emergencyProfile?.emergencyContact;
  const hasContactPhone = !!contact?.phone?.trim();

  const handleSendWhatsAppAlert = () => {
    if (!hasContactPhone) return;
    const patientName = emergencyProfile?.patientFullName || 'El paciente';
    const message = `🚨 *ALERTA DE EMERGENCIA — AcompañaMed*\n\nHola ${contact?.name || 'familiar'}, ${patientName} necesita asistencia inmediata.\n\nPor favor, comunícate o acude a su domicilio a la brevedad.`;
    CommunicationService.openWhatsApp(contact!.phone, message);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.panelCard}>
        {/* Cabecera ICE: Ficha Médica y Grupo Sanguíneo */}
        <View style={styles.headerCardRow}>
          <View style={styles.bloodTypeBadge}>
            <Text style={styles.bloodTypeLabel}>GRUPO</Text>
            <Text style={styles.bloodTypeValue}>{emergencyProfile.bloodType || '—'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{emergencyProfile.patientFullName || 'Paciente'}</Text>
            <Text style={styles.patientMeta}>
              {emergencyProfile.age ? `${emergencyProfile.age} años` : 'Edad no registrada'} • {emergencyProfile.healthInsurance || 'Seguro de salud no registrado'}
            </Text>
          </View>
          {onOpenFamilyPairing && (
            <TouchableOpacity
              style={styles.btnEditHeader}
              onPress={onOpenFamilyPairing}
              accessibilityRole="button"
              accessibilityLabel="Editar ficha médica en configuración"
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color="#0284C7" />
            </TouchableOpacity>
          )}
        </View>

        {/* Alerta de Alergias Severas (Crítico para Paramédicos) */}
        <View style={styles.allergySevereCard}>
          <MaterialCommunityIcons name="alert-octagon" size={24} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.allergySevereTitle}>Alergias Medicamentosas Registradas:</Text>
            <Text style={styles.allergySevereList}>
              {(emergencyProfile?.allergies || []).join(' • ') || 'Sin alergias registradas.'}
            </Text>
          </View>
        </View>

        {/* Diagnósticos y Condiciones Médicas Crónicas */}
        <View style={styles.chronicBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <MaterialCommunityIcons name="clipboard-pulse-outline" size={16} color="#0F172A" />
            <Text style={styles.chronicBoxTitle}>Diagnósticos y Condiciones Médicas:</Text>
          </View>
          {(emergencyProfile?.chronicConditions || []).map((cond, idx) => (
            <Text key={idx} style={styles.chronicItem}>
              • {cond}
            </Text>
          ))}
          {(!emergencyProfile?.chronicConditions || emergencyProfile.chronicConditions.length === 0) && (
            <Text style={styles.chronicItem}>Sin diagnósticos crónicos registrados.</Text>
          )}
        </View>

        {/* Contacto de Auxilio Inmediato (Red Familiar) */}
        <View style={styles.contactBox}>
          <View style={styles.contactHeaderRow}>
            <MaterialCommunityIcons name="account-alert" size={18} color="#065F46" />
            <Text style={styles.contactBoxHeader}>CONTACTO DE AUXILIO FAMILIAR</Text>
          </View>
          
          <Text style={styles.contactName}>
            {contact?.name || 'Contacto no configurado'}
          </Text>
          <Text style={styles.contactRelation}>
            {contact?.relationship ? `Parentesco: ${contact.relationship}` : 'Edite la ficha en Ajustes para registrarlo'}
          </Text>

          {/* Botón Primario: Llamada Telefónica Directa */}
          <TouchableOpacity
            style={[styles.btnCall, !hasContactPhone && styles.btnCallDisabled]}
            onPress={() => onCallEmergency(contact?.phone || '', contact?.name || 'Contacto')}
            activeOpacity={0.85}
            disabled={!hasContactPhone}
            accessibilityRole="button"
            accessibilityLabel={`Llamar de emergencia a ${contact?.name || 'contacto'} al ${contact?.phone || ''}`}
          >
            <MaterialCommunityIcons name="phone" size={22} color="#FFFFFF" />
            <Text style={styles.btnCallText}>
              {hasContactPhone ? `Llamar a ${contact?.name || 'Contacto'} (${contact?.phone})` : 'Falta registrar un número de teléfono'}
            </Text>
          </TouchableOpacity>

          {/* Botón Secundario: Alerta Rápida por WhatsApp */}
          {hasContactPhone && (
            <TouchableOpacity
              style={styles.btnWhatsApp}
              onPress={handleSendWhatsAppAlert}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje de alerta inmediata por WhatsApp"
            >
              <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.btnWhatsAppText}>
                Enviar Mensaje de Auxilio por WhatsApp
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Centrales Nacionales de Emergencia (1 toque para emergencias médicas mayores) */}
        <View style={styles.publicServicesBox}>
          <Text style={styles.publicServicesTitle}>Centrales Oficiales de Emergencia:</Text>
          <View style={styles.publicServicesGrid}>
            <TouchableOpacity
              style={styles.publicServiceChip}
              onPress={() => onCallEmergency('106', 'SAMU Ambulancia')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Llamar a SAMU Ambulancia al 106"
            >
              <MaterialCommunityIcons name="ambulance" size={18} color="#DC2626" />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.publicServiceChipCode}>106</Text>
                <Text style={styles.publicServiceChipLabel}>SAMU Ambulancia</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publicServiceChip}
              onPress={() => onCallEmergency('116', 'Bomberos')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Llamar a Bomberos al 116"
            >
              <MaterialCommunityIcons name="fire-truck" size={18} color="#D97706" />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.publicServiceChipCode}>116</Text>
                <Text style={styles.publicServiceChipLabel}>Bomberos</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publicServiceChip}
              onPress={() => onCallEmergency('105', 'Policía Nacional')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Llamar a la Policía al 105"
            >
              <MaterialCommunityIcons name="shield-account" size={18} color="#0284C7" />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.publicServiceChipCode}>105</Text>
                <Text style={styles.publicServiceChipLabel}>Policía Nacional</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Carnet de Vinculación y Respaldo Familiar */}
        {familyCode ? (
          <View style={styles.backupCardBox}>
            <View style={styles.backupHeaderRow}>
              <MaterialCommunityIcons name="shield-key-outline" size={18} color="#0284C7" />
              <Text style={styles.backupTitle}>CÓDIGO DE VINCULACIÓN FAMILIAR</Text>
            </View>
            <Text style={styles.backupDesc}>
              Este código conecta los teléfonos del paciente y del cuidador, y permite restaurar todo el botiquín si cambia de equipo:
            </Text>
            <View style={styles.codePillRow}>
              <Text style={styles.codePillText}>{familyCode}</Text>
              {onOpenFamilyPairing && (
                <TouchableOpacity
                  style={styles.btnShowPairingQr}
                  onPress={onOpenFamilyPairing}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Ver código QR para vincular celular"
                >
                  <MaterialCommunityIcons name="qrcode" size={16} color="#0284C7" />
                  <Text style={styles.btnShowPairingQrText}>Ver Código QR</Text>
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  headerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bloodTypeBadge: {
    width: 54,
    height: 54,
    borderRadius: 8,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientMeta: {
    fontSize: 12.5,
    color: '#334155',
    marginTop: 2,
  },
  btnEditHeader: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignSelf: 'center',
  },
  allergySevereCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  allergySevereTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  allergySevereList: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 18,
  },
  chronicBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chronicBoxTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  chronicItem: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  contactBox: {
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactBoxHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  contactName: {
    fontSize: 16,
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
    minHeight: 52,
    borderRadius: 8,
    gap: 8,
    marginTop: 6,
  },
  btnCallDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnCallText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: 8,
    gap: 8,
  },
  btnWhatsAppText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  publicServicesBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  publicServicesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  publicServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  publicServiceChip: {
    flex: 1,
    minWidth: 90,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  publicServiceChipCode: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  publicServiceChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  backupCardBox: {
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
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
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  codePillText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  btnShowPairingQr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnShowPairingQrText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
});
