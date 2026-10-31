import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActorRole, EmergencyProfile } from '../../domain';
import { CommunicationService } from '../../infrastructure/CommunicationService';

interface Props {
  emergencyProfile: EmergencyProfile;
  familyCode?: string;
  onCallEmergency: (phone: string, name: string) => void;
  onOpenFamilyPairing?: () => void;
  activeRole?: ActorRole;
}

export const EmergencyProfileCard: React.FC<Props> = ({
  emergencyProfile,
  familyCode,
  onCallEmergency,
  onOpenFamilyPairing,
  activeRole = 'patient',
}) => {
  const isCaregiver = activeRole === 'caregiver';
  const contact = emergencyProfile?.emergencyContact;

  // Si quien visualiza la pantalla es el Cuidador, el contacto de auxilio es el Paciente / Teléfono del Hogar
  // Si quien visualiza la pantalla es el Paciente, el contacto es su Cuidadora Principal (ej. María Alhua)
  const targetName = isCaregiver
    ? emergencyProfile?.patientFullName || 'Don Manuel'
    : contact?.name || 'Contacto de Auxilio';

  const targetRelationship = isCaregiver
    ? 'Paciente a cargo (Teléfono directo o casa)'
    : contact?.relationship
    ? `Parentesco: ${contact.relationship}`
    : 'Contacto familiar de auxilio';

  const targetPhone = isCaregiver
    ? emergencyProfile?.patientPhone || contact?.phone || ''
    : contact?.phone || '';

  const hasPhone = Boolean(targetPhone && targetPhone.trim().length > 3);

  const boxHeader = isCaregiver
    ? 'CONTACTO DIRECTO CON EL PACIENTE / HOGAR'
    : 'CONTACTO DE AUXILIO FAMILIAR';

  const callButtonLabel = isCaregiver
    ? hasPhone
      ? `Llamar a ${targetName} (${targetPhone})`
      : 'Falta registrar teléfono del paciente'
    : hasPhone
    ? `Llamar a ${targetName} (${targetPhone})`
    : 'Falta registrar número de teléfono';

  const whatsAppButtonLabel = isCaregiver
    ? 'Enviar Mensaje de Auxilio al Paciente'
    : 'Enviar Mensaje de Auxilio por WhatsApp';

  const handleSendWhatsAppAlert = () => {
    if (!hasPhone) return;
    const patientName = emergencyProfile?.patientFullName || 'El paciente';
    let message = '';
    if (isCaregiver) {
      message = `🚨 *ALERTA DE EMERGENCIA — AcompañaMed*\n\nHola ${patientName}, te escribe tu cuidador (${contact?.name || 'Familiar'}). Detectamos una alerta o necesitamos comunicarnos contigo de inmediato.\n\nPor favor contesta la llamada o abre la aplicación.`;
    } else {
      message = `🚨 *ALERTA DE EMERGENCIA — AcompañaMed*\n\nHola ${contact?.name || 'familiar'}, ${patientName} necesita asistencia inmediata.\n\nPor favor, comunícate o acude a su domicilio a la brevedad.`;
    }
    CommunicationService.openWhatsApp(targetPhone, message);
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

        {/* Contacto de Auxilio Inmediato (Red Familiar / Paciente) */}
        <View style={styles.contactBox}>
          <View style={styles.contactHeaderRow}>
            <MaterialCommunityIcons
              name={isCaregiver ? 'account-box-outline' : 'account-alert'}
              size={18}
              color="#065F46"
            />
            <Text style={styles.contactBoxHeader}>{boxHeader}</Text>
          </View>
          
          <Text style={styles.contactName}>{targetName}</Text>
          <Text style={styles.contactRelation}>{targetRelationship}</Text>

          {/* Botón Primario: Llamada Telefónica Directa */}
          <TouchableOpacity
            style={[styles.btnCall, !hasPhone && styles.btnCallDisabled]}
            onPress={() => onCallEmergency(targetPhone, targetName)}
            activeOpacity={0.85}
            disabled={!hasPhone}
            accessibilityRole="button"
            accessibilityLabel={callButtonLabel}
          >
            <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
            <Text style={styles.btnCallText} numberOfLines={1} ellipsizeMode="tail">
              {callButtonLabel}
            </Text>
          </TouchableOpacity>

          {/* Botón Secundario: Alerta Rápida por WhatsApp */}
          {hasPhone && (
            <TouchableOpacity
              style={styles.btnWhatsApp}
              onPress={handleSendWhatsAppAlert}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={whatsAppButtonLabel}
            >
              <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.btnWhatsAppText} numberOfLines={1} ellipsizeMode="tail">
                {whatsAppButtonLabel}
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

        {/* Respaldo Familiar en la Nube */}
        {familyCode ? (
          <View style={styles.backupCardBox}>
            <View style={styles.backupHeaderRow}>
              <MaterialCommunityIcons name="cloud-sync" size={16} color="#0369A1" />
              <Text style={styles.backupTitle}>CÓDIGO DE ENLACE DE EMERGENCIA</Text>
            </View>
            <Text style={styles.backupDesc}>
              Comparta este código con médicos o paramédicos para acceder al historial farmacológico desde cualquier teléfono.
            </Text>
            <View style={styles.codePillRow}>
              <Text style={styles.codePillText}>{familyCode}</Text>
              {onOpenFamilyPairing && (
                <TouchableOpacity
                  style={styles.btnShowPairingQr}
                  onPress={onOpenFamilyPairing}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Ver código QR familiar"
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
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  headerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bloodTypeBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
  },
  bloodTypeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  bloodTypeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
    marginTop: -2,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  btnEditHeader: {
    padding: 6,
    minHeight: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  allergySevereCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
  },
  allergySevereTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  allergySevereList: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 2,
  },
  chronicBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chronicBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  chronicItem: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginLeft: 6,
  },
  contactBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 14,
    gap: 8,
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
    paddingHorizontal: 16,
    minHeight: 52,
    borderRadius: 8,
    gap: 10,
    marginTop: 6,
  },
  btnCallDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnCallText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
    textAlign: 'center',
  },
  btnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 46,
    borderRadius: 8,
    gap: 8,
  },
  btnWhatsAppText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    textAlign: 'center',
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
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 6,
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
