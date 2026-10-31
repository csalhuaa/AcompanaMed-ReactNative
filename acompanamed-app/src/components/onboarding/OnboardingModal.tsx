import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActorRole } from '../../domain';
import { CameraQrScannerModal } from '../modals/CameraQrScannerModal';

interface Props {
  visible: boolean;
  busy?: boolean;
  error?: string;
  onFinishOnboarding: (data: {
    role: ActorRole;
    startMode: 'empty' | 'demo' | 'pair';
    patientName: string;
    pairCode?: string;
  }) => void;
}

export const OnboardingModal: React.FC<Props> = ({
  visible,
  busy = false,
  error,
  onFinishOnboarding,
}) => {
  const [selectedRole, setSelectedRole] = useState<ActorRole>('patient');
  const [startMode, setStartMode] = useState<'empty' | 'demo' | 'pair'>('empty');
  const [patientName, setPatientName] = useState('');
  const [pairCode, setPairCode] = useState('');
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState('');

  const handleSelectRole = (role: ActorRole) => {
    setSelectedRole(role);
    if (role === 'caregiver' && startMode === 'empty') {
      setStartMode('pair');
    } else if (role === 'patient' && startMode === 'pair') {
      setStartMode('empty');
    }
  };

  const handleScanSuccess = (extractedCode: string) => {
    setIsScannerVisible(false);
    const clean = extractedCode.trim().toUpperCase();
    setPairCode(clean);
    setScannedFeedback(clean);
  };

  const handleStart = () => {
    if (busy) return;
    if (startMode === 'pair') {
      const cleanCode = pairCode.trim().toUpperCase();
      if (!cleanCode) {
        Alert.alert(
          'Código Requerido',
          'Por favor ingrese o escanee el código familiar (ej. MED-MANU-74) para conectarse.'
        );
        return;
      }
      onFinishOnboarding({
        role: selectedRole,
        startMode: 'pair',
        patientName: patientName.trim() || (selectedRole === 'patient' ? 'Paciente' : 'Familiar'),
        pairCode: cleanCode,
      });
      return;
    }

    onFinishOnboarding({
      role: selectedRole,
      startMode: startMode as 'empty' | 'demo',
      patientName:
        patientName.trim() ||
        (startMode === 'demo'
          ? 'Manuel Jesús Alhua'
          : selectedRole === 'patient'
          ? 'Don Manuel'
          : 'Mi Paciente'),
    });
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Cabecera de Bienvenida */}
            <View style={styles.headerBox}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="pill" size={30} color="#0284C7" />
              </View>
              <Text style={styles.appTitle}>AcompañaMed</Text>
              <Text style={styles.welcomeSubtitle}>
                Asistente de Adherencia Farmacológica y Cuidado Familiar
              </Text>
            </View>

            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* PASO 1: SELECCIONAR ROL */}
              <Text style={styles.stepTitle}>1. ¿Quién usará principalmente este teléfono?</Text>
              <View style={styles.roleSelectionRow}>
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    selectedRole === 'patient' && styles.roleCardActive,
                  ]}
                  onPress={() => handleSelectRole('patient')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="account-heart"
                    size={28}
                    color={selectedRole === 'patient' ? '#0284C7' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.roleCardTitle,
                      selectedRole === 'patient' && styles.roleCardTitleActive,
                    ]}
                  >
                    Paciente / Senior
                  </Text>
                  <Text style={styles.roleCardDesc}>
                    Botones grandes de auxilio, lectura por voz y botiquín protegido.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    selectedRole === 'caregiver' && styles.roleCardActive,
                  ]}
                  onPress={() => handleSelectRole('caregiver')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={28}
                    color={selectedRole === 'caregiver' ? '#059669' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.roleCardTitle,
                      selectedRole === 'caregiver' && styles.roleCardTitleActive,
                    ]}
                  >
                    Cuidador / Familiar
                  </Text>
                  <Text style={styles.roleCardDesc}>
                    Control total de botiquín, enlace multi-dispositivo y telemetría.
                  </Text>
                </TouchableOpacity>
              </View>

              {/* PASO 2: MODO DE INICIO SEGÚN ROL */}
              <Text style={[styles.stepTitle, { marginTop: 18 }]}>
                {selectedRole === 'caregiver'
                  ? '2. ¿Cómo desea comenzar como Cuidador?'
                  : '2. ¿Cómo desea comenzar como Paciente?'}
              </Text>

              {selectedRole === 'caregiver' ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.modeCard,
                      startMode === 'pair' && styles.modeCardActive,
                    ]}
                    onPress={() => setStartMode('pair')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.modeCardHeader}>
                      <MaterialCommunityIcons
                        name="cellphone-link"
                        size={20}
                        color={startMode === 'pair' ? '#0284C7' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.modeCardTitle,
                          startMode === 'pair' && styles.modeCardTitleActive,
                        ]}
                      >
                        Vincularme al Teléfono del Paciente (Recomendado)
                      </Text>
                    </View>
                    <Text style={styles.modeCardDesc}>
                      Conéctese en tiempo real mediante código o escaneando el QR del paciente para monitorear tomas en la nube.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeCard,
                      startMode === 'empty' && styles.modeCardActive,
                      { marginTop: 8 },
                    ]}
                    onPress={() => setStartMode('empty')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.modeCardHeader}>
                      <MaterialCommunityIcons
                        name="plus-circle-outline"
                        size={20}
                        color={startMode === 'empty' ? '#0284C7' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.modeCardTitle,
                          startMode === 'empty' && styles.modeCardTitleActive,
                        ]}
                      >
                        Configurar Nuevo Botiquín desde este Teléfono
                      </Text>
                    </View>
                    <Text style={styles.modeCardDesc}>
                      Para registrar recetas manualmente en este dispositivo sin vincular a otro teléfono.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeCard,
                      startMode === 'demo' && styles.modeCardActive,
                      { marginTop: 8 },
                    ]}
                    onPress={() => setStartMode('demo')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.modeCardHeader}>
                      <MaterialCommunityIcons
                        name="flask-outline"
                        size={20}
                        color={startMode === 'demo' ? '#0284C7' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.modeCardTitle,
                          startMode === 'demo' && styles.modeCardTitleActive,
                        ]}
                      >
                        Cargar Caso Clínico de Ejemplo (Don Manuel)
                      </Text>
                    </View>
                    <Text style={styles.modeCardDesc}>
                      Carga el caso de prueba completo para evaluar la plataforma de inmediato.
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.modeCard,
                      startMode === 'empty' && styles.modeCardActive,
                    ]}
                    onPress={() => setStartMode('empty')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.modeCardHeader}>
                      <MaterialCommunityIcons
                        name="plus-circle-outline"
                        size={20}
                        color={startMode === 'empty' ? '#0284C7' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.modeCardTitle,
                          startMode === 'empty' && styles.modeCardTitleActive,
                        ]}
                      >
                        Iniciar con Botiquín Vacío (Uso Real)
                      </Text>
                    </View>
                    <Text style={styles.modeCardDesc}>
                      Recomendado para pacientes reales. Ingrese los fármacos prescritos por su médico.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeCard,
                      startMode === 'pair' && styles.modeCardActive,
                      { marginTop: 8 },
                    ]}
                    onPress={() => setStartMode('pair')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.modeCardHeader}>
                      <MaterialCommunityIcons
                        name="qrcode-scan"
                        size={20}
                        color={startMode === 'pair' ? '#0284C7' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.modeCardTitle,
                          startMode === 'pair' && styles.modeCardTitleActive,
                        ]}
                      >
                        Vincularme a un Código Familiar o QR Existente
                      </Text>
                    </View>
                    <Text style={styles.modeCardDesc}>
                      Si su cuidador ya configuró el botiquín, conéctese escaneando su QR o ingresando el código.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeCard,
                      startMode === 'demo' && styles.modeCardActive,
                      { marginTop: 8 },
                    ]}
                    onPress={() => setStartMode('demo')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.modeCardHeader}>
                      <MaterialCommunityIcons
                        name="flask-outline"
                        size={20}
                        color={startMode === 'demo' ? '#0284C7' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.modeCardTitle,
                          startMode === 'demo' && styles.modeCardTitleActive,
                        ]}
                      >
                        Cargar Caso Clínico de Ejemplo (Don Manuel)
                      </Text>
                    </View>
                    <Text style={styles.modeCardDesc}>
                      Carga 3 medicamentos de prueba (Losartán, Metformina, Atorvastatina) para evaluar el sistema.
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* PASO 3: ENTRADA DE DATOS O ESCANEO */}
              {startMode === 'pair' ? (
                <>
                  <Text style={[styles.stepTitle, { marginTop: 18 }]}>
                    3. Conectar mediante Código QR o Código Familiar:
                  </Text>

                  {/* Botón Principal para Escanear QR con Cámara */}
                  <TouchableOpacity
                    style={styles.scannerButton}
                    onPress={() => setIsScannerVisible(true)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="camera-outline" size={20} color="#0284C7" />
                    <Text style={styles.scannerButtonText}>Escanear Código QR con Cámara</Text>
                  </TouchableOpacity>

                  {/* Indicador de código detectado por escaneo */}
                  {scannedFeedback ? (
                    <View style={styles.scannedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={16} color="#059669" />
                      <Text style={styles.scannedBadgeText}>
                        Código detectado por cámara: <Text style={{ fontWeight: '800' }}>{scannedFeedback}</Text>
                      </Text>
                    </View>
                  ) : null}

                  {/* Separador sutil */}
                  <View style={styles.orRow}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>o ingrese el código alfanumérico</Text>
                    <View style={styles.orLine} />
                  </View>

                  <TextInput
                    style={styles.codeInput}
                    placeholder="Ej. MED-MANU-74"
                    placeholderTextColor="#94A3B8"
                    value={pairCode}
                    onChangeText={(val) => {
                      setPairCode(val.toUpperCase());
                      setScannedFeedback('');
                    }}
                    autoCapitalize="characters"
                  />

                  {/* Nota informativa limpia sin emojis */}
                  <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="information-outline" size={16} color="#0284C7" />
                    <Text style={styles.infoText}>
                      El código familiar y el QR se encuentran en la barra superior o en Ajustes del teléfono principal.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.stepTitle, { marginTop: 18 }]}>
                    {selectedRole === 'patient'
                      ? '3. Nombre del paciente:'
                      : '3. Nombre del paciente a cuidar:'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      startMode === 'demo'
                        ? 'Manuel Jesús Alhua'
                        : selectedRole === 'patient'
                        ? 'Ej. Don Manuel'
                        : 'Ej. Rosa Martínez'
                    }
                    placeholderTextColor="#94A3B8"
                    value={patientName}
                    onChangeText={setPatientName}
                  />
                  <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="information-outline" size={16} color="#0284C7" />
                    <Text style={styles.infoText}>
                      Este nombre se utilizará en los recordatorios hablados y en la ficha de auxilio médico.
                    </Text>
                  </View>
                </>
              )}

              {/* BANNER DE ERROR */}
              {error ? (
                <View
                  style={styles.errorBanner}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                >
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.errorTitle}>Aviso de Configuración</Text>
                    <Text style={styles.errorDescription}>{error}</Text>
                  </View>
                </View>
              ) : null}

              {/* BOTÓN COMENZAR */}
              <TouchableOpacity
                style={[styles.btnStart, busy && styles.btnStartDisabled]}
                onPress={handleStart}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{ busy, disabled: busy }}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                ) : null}
                <Text style={styles.btnStartText}>
                  {busy
                    ? 'Conectando con la nube…'
                    : startMode === 'pair'
                    ? 'Conectar y Comenzar'
                    : 'Comenzar a usar AcompañaMed'}
                </Text>
                {!busy ? (
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                ) : null}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ESCÁNER QR CON CÁMARA */}
      <CameraQrScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerBox: {
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  appTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  scrollBody: {
    padding: 18,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  roleSelectionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  roleCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  roleCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
  roleCardTitleActive: {
    color: '#0284C7',
  },
  roleCardDesc: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  modeCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
  },
  modeCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modeCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  modeCardTitleActive: {
    color: '#0284C7',
  },
  modeCardDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  scannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  scannerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  scannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 10,
  },
  scannedBadgeText: {
    fontSize: 12,
    color: '#065F46',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  codeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  errorDescription: {
    fontSize: 11.5,
    color: '#B91C1C',
    lineHeight: 15,
    marginTop: 2,
  },
  btnStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  btnStartDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnStartText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
