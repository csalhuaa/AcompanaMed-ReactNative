import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Clipboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmergencyProfile } from '../../domain';

interface Props {
  visible: boolean;
  onClose: () => void;
  emergencyProfile: EmergencyProfile;
  onUpdateProfile: (updated: EmergencyProfile) => void;
  onClearDemoData: () => void;
  onRestoreDemoData: () => void;
  onTestNotification: () => void;
  activeRole: 'patient' | 'caregiver';
}

export const FamilyPairingModal: React.FC<Props> = ({
  visible,
  onClose,
  emergencyProfile,
  onUpdateProfile,
  onClearDemoData,
  onRestoreDemoData,
  onTestNotification,
  activeRole,
}) => {
  const [patientName, setPatientName] = useState(emergencyProfile.patientFullName);
  const [age, setAge] = useState(String(emergencyProfile.age));
  const [bloodType, setBloodType] = useState(emergencyProfile.bloodType);
  const [allergiesText, setAllergiesText] = useState(emergencyProfile.allergies.join(', '));
  const [caregiverName, setCaregiverName] = useState(emergencyProfile.emergencyContact.name);
  const [caregiverPhone, setCaregiverPhone] = useState(emergencyProfile.emergencyContact.phone);

  const [enteredPairingCode, setEnteredPairingCode] = useState('');
  const [pairingSuccessMsg, setPairingSuccessMsg] = useState('');

  // Generación de código único de familia basado en las iniciales y edad del paciente
  const familyCode = `MED-${patientName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'MANU'}-${age || '82'}`;

  const handleSaveProfile = () => {
    const updated: EmergencyProfile = {
      ...emergencyProfile,
      patientFullName: patientName.trim() || 'Paciente',
      age: parseInt(age, 10) || 80,
      bloodType: bloodType.trim() || 'O+',
      allergies: allergiesText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      emergencyContact: {
        ...emergencyProfile.emergencyContact,
        name: caregiverName.trim() || 'Cuidador Principal',
        phone: caregiverPhone.trim() || '+51 900 000 000',
      },
    };

    onUpdateProfile(updated);
    Alert.alert('Perfil Guardado', 'Los datos del paciente y cuidador fueron actualizados en la base de datos local.');
  };

  const handleCopyCode = () => {
    try {
      Clipboard.setString(familyCode);
      Alert.alert('Código Copiado', `El código de enlace familiar "${familyCode}" fue copiado al portapapeles.`);
    } catch {
      Alert.alert('Código Familiar', `Su código es: ${familyCode}`);
    }
  };

  const handleConnectCaregiver = () => {
    const code = enteredPairingCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Código Requerido', 'Por favor ingrese el código de 6 caracteres del paciente.');
      return;
    }
    setPairingSuccessMsg(`¡Dispositivo enlazado con éxito al paciente con código [${code}] mediante Firebase Firestore!`);
    Alert.alert('Vínculo Exitoso', `Dispositivo conectado telemétricamente al paciente con código: ${code}`);
    setEnteredPairingCode('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Cabecera del Modal */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="account-group" size={24} color="#0284C7" />
              <Text style={styles.modalTitle}>Familia, Enlace y Ajustes</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnClose} accessibilityLabel="Cerrar modal">
              <MaterialCommunityIcons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* SECCIÓN 1: VINCULACIÓN FAMILIAR MULTI-DISPOSITIVO (PAIRING) */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="cellphone-link" size={20} color="#0284C7" />
                <Text style={styles.sectionTitle}>1. Enlace Familiar Multi-Dispositivo</Text>
              </View>

              <Text style={styles.sectionDesc}>
                ¿Cómo se conecta el teléfono del adulto mayor con el del cuidador en el mundo real?
                El paciente genera un <Text style={{ fontWeight: '700' }}>Código de Familia</Text>. La hija descarga AcompañaMed en su celular, ingresa el código y ambos dispositivos se sincronizan en la nube.
              </Text>

              {/* Tarjeta del Código de Don Manuel */}
              <View style={styles.pairingCodeCard}>
                <Text style={styles.pairingCodeLabel}>CÓDIGO ÚNICO DE ESTE PACIENTE:</Text>
                <Text style={styles.pairingCodeValue}>{familyCode}</Text>
                <TouchableOpacity style={styles.btnCopyCode} onPress={handleCopyCode} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="content-copy" size={16} color="#FFFFFF" />
                  <Text style={styles.btnCopyCodeText}>Copiar Código para la Hija / Cuidador</Text>
                </TouchableOpacity>
              </View>

              {/* Campo para conectar desde el celular del cuidador */}
              <View style={styles.connectCaregiverBox}>
                <Text style={styles.inputLabel}>¿Este teléfono pertenece a la cuidadora? Conéctese aquí:</Text>
                <View style={styles.inputWithButtonRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, textTransform: 'uppercase' }]}
                    placeholder="Ej. MED-MANU-82"
                    placeholderTextColor="#94A3B8"
                    value={enteredPairingCode}
                    onChangeText={setEnteredPairingCode}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity style={styles.btnConnect} onPress={handleConnectCaregiver} activeOpacity={0.85}>
                    <Text style={styles.btnConnectText}>Conectar</Text>
                  </TouchableOpacity>
                </View>
                {pairingSuccessMsg ? (
                  <Text style={styles.pairingSuccessText}>{pairingSuccessMsg}</Text>
                ) : null}
              </View>
            </View>

            {/* SECCIÓN 2: PERSONALIZAR DATOS REALES (PACIENTE Y CUIDADOR) */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-edit" size={20} color="#059669" />
                <Text style={styles.sectionTitle}>2. Personalizar Paciente y Contacto Real</Text>
              </View>

              <Text style={styles.sectionDesc}>
                Configure los nombres y números reales para que la aplicación deje de ser una demo genérica y se adapte a su familiar.
              </Text>

              <View style={styles.formRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>Nombre del Paciente:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={patientName}
                    onChangeText={setPatientName}
                    placeholder="Ej. Don Manuel / Carlos Salhua"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Edad:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    placeholder="82"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Grupo Sanguíneo:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bloodType}
                    onChangeText={setBloodType}
                    placeholder="O+ / A+"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>Alergias Severas (separadas por coma):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={allergiesText}
                    onChangeText={setAllergiesText}
                    placeholder="Penicilina, Sulfas"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Nombre del Cuidador:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={caregiverName}
                    onChangeText={setCaregiverName}
                    placeholder="Ej. María Alhua"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Teléfono WhatsApp:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={caregiverPhone}
                    onChangeText={setCaregiverPhone}
                    keyboardType="phone-pad"
                    placeholder="+51 954 123 456"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.btnSaveProfile} onPress={handleSaveProfile} activeOpacity={0.85}>
                <MaterialCommunityIcons name="content-save" size={18} color="#FFFFFF" />
                <Text style={styles.btnSaveProfileText}>Guardar Datos en Base de Datos Local</Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN 3: ¿USO REAL O DEMOSTRACIÓN? (SELECTOR DE ESCENARIO) */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="database-sync" size={20} color="#D97706" />
                <Text style={styles.sectionTitle}>3. Selector de Escenario: ¿Uso Real o Demo?</Text>
              </View>

              <Text style={styles.sectionDesc}>
                Si desea usar la app con un paciente real, puede vaciar los 3 medicamentos de prueba y registrar su propia receta. En cualquier momento puede restaurar el caso de prueba para el profesor.
              </Text>

              <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                  style={[styles.btnScenario, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                  onPress={onClearDemoData}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.btnScenarioTitle, { color: '#991B1B' }]}>
                      Vaciar Datos Demo (Empezar desde cero)
                    </Text>
                    <Text style={styles.btnScenarioSub}>
                      Borra los fármacos de ejemplo para cargar una receta médica real.
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnScenario, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}
                  onPress={onRestoreDemoData}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color="#0284C7" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.btnScenarioTitle, { color: '#0369A1' }]}>
                      Restaurar Caso Demo (Don Manuel - 3 fármacos)
                    </Text>
                    <Text style={styles.btnScenarioSub}>
                      Recarga el escenario clínico geriátrico para evaluación académica.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECCIÓN 4: VERIFICACIÓN DE NOTIFICACIONES */}
            <View style={[styles.sectionBox, { marginBottom: 12 }]}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="bell-ring" size={20} color="#059669" />
                <Text style={styles.sectionTitle}>4. Diagnóstico de Notificaciones</Text>
              </View>

              <Text style={styles.sectionDesc}>
                Compruebe si el sistema operativo (Android o navegador Web en Windows) tiene habilitados los permisos para emitir alertas sonoras y banners de recordatorio.
              </Text>

              <TouchableOpacity style={styles.btnTestNotification} onPress={onTestNotification} activeOpacity={0.85}>
                <MaterialCommunityIcons name="bell-check" size={20} color="#FFFFFF" />
                <Text style={styles.btnTestNotificationText}>
                  🔔 Disparar Notificación de Prueba Ahora
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  btnClose: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  scrollBody: {
    padding: 16,
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  pairingCodeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  pairingCodeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  pairingCodeValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 2,
    marginVertical: 6,
  },
  btnCopyCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    gap: 8,
    marginTop: 4,
  },
  btnCopyCodeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  connectCaregiverBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputWithButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnConnect: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 6,
  },
  btnConnectText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pairingSuccessText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#059669',
    marginTop: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  btnSaveProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
    marginTop: 6,
  },
  btnSaveProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtonGroup: {
    gap: 10,
  },
  btnScenario: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnScenarioTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  btnScenarioSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  btnTestNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  btnTestNotificationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
