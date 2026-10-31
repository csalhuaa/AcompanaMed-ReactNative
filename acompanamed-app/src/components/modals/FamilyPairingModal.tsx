import React, { useState, useEffect } from 'react';
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
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmergencyProfile } from '../../domain';
import {
  generateQrDataUrl,
  buildPairingUrl,
  defaultCloudSyncService,
  formatDeviceActivityStatus,
  ConnectedDevice,
} from '../../infrastructure';
import { CameraQrScannerModal } from './CameraQrScannerModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  emergencyProfile: EmergencyProfile;
  onUpdateProfile: (updated: EmergencyProfile) => void;
  onClearDemoData: () => void;
  onRestoreDemoData: () => void;
  onTestNotification: () => void;
  activeRole: 'patient' | 'caregiver';
  onSelectRole: (role: 'patient' | 'caregiver') => void;
  familyCode?: string;
  onConnectFamilyCode?: (code: string) => Promise<{ success: boolean; message: string }>;
  isSyncing?: boolean;
  lastSyncTime?: string;
  currentDeviceId?: string;
  onRevokeDevice?: (deviceId: string) => Promise<boolean>;
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
  onSelectRole,
  familyCode: propFamilyCode,
  onConnectFamilyCode,
  isSyncing,
  lastSyncTime,
  currentDeviceId,
  onRevokeDevice,
}) => {
  const [patientName, setPatientName] = useState(emergencyProfile.patientFullName);
  const [age, setAge] = useState(String(emergencyProfile.age));
  const [bloodType, setBloodType] = useState(emergencyProfile.bloodType);
  const [allergiesText, setAllergiesText] = useState(emergencyProfile.allergies.join(', '));
  const [caregiverName, setCaregiverName] = useState(emergencyProfile.emergencyContact.name);
  const [caregiverPhone, setCaregiverPhone] = useState(emergencyProfile.emergencyContact.phone);

  const [enteredPairingCode, setEnteredPairingCode] = useState('');
  const [pairingSuccessMsg, setPairingSuccessMsg] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Estados de QR y Dispositivos Conectados
  const [pairingTab, setPairingTab] = useState<'qr' | 'code'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(false);
  const [isScannerVisible, setIsScannerVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) return;
    setPatientName(emergencyProfile.patientFullName);
    setAge(emergencyProfile.age ? String(emergencyProfile.age) : '');
    setBloodType(emergencyProfile.bloodType);
    setAllergiesText(emergencyProfile.allergies.join(', '));
    setCaregiverName(emergencyProfile.emergencyContact.name);
    setCaregiverPhone(emergencyProfile.emergencyContact.phone);
  }, [visible, emergencyProfile]);

  // Generación de código único de familia basado en las iniciales y edad del paciente
  const generatedCode = `MED-${patientName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'MANU'}-${age || '82'}`;
  const effectiveFamilyCode = propFamilyCode || generatedCode;

  const loadDevices = async () => {
    if (!effectiveFamilyCode) return;
    setIsLoadingDevices(true);
    try {
      const list = await defaultCloudSyncService.fetchConnectedDevices(effectiveFamilyCode);
      setConnectedDevices(list);
    } catch {
      // Offline fallback
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (visible && effectiveFamilyCode) {
      setIsLoadingQr(true);
      const url = buildPairingUrl(effectiveFamilyCode);
      generateQrDataUrl(url).then((uri) => {
        if (isMounted) {
          setQrDataUrl(uri);
          setIsLoadingQr(false);
        }
      });
      loadDevices();
    }
    return () => {
      isMounted = false;
    };
  }, [visible, effectiveFamilyCode]);

  const handleSaveProfile = () => {
    const updated: EmergencyProfile = {
      ...emergencyProfile,
      patientFullName: patientName.trim() || 'Paciente',
      age: /^\d+$/.test(age.trim()) ? Number(age) : 0,
      bloodType: bloodType.trim(),
      allergies: allergiesText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      emergencyContact: {
        ...emergencyProfile.emergencyContact,
        name: caregiverName.trim(),
        phone: caregiverPhone.trim(),
      },
    };

    onUpdateProfile(updated);
    Alert.alert('Perfil Guardado', 'Los datos del paciente y cuidador fueron actualizados en la base de datos local.');
  };

  const handleCopyCode = () => {
    try {
      Clipboard.setString(effectiveFamilyCode);
      Alert.alert('Código Copiado', `El código de enlace familiar "${effectiveFamilyCode}" fue copiado al portapapeles.`);
    } catch {
      Alert.alert('Código Familiar', `Su código es: ${effectiveFamilyCode}`);
    }
  };

  const handleCopyDirectLink = () => {
    const url = buildPairingUrl(effectiveFamilyCode);
    try {
      Clipboard.setString(url);
      Alert.alert('Enlace Copiado', 'El enlace directo fue copiado. Puede enviarlo por WhatsApp para que su familiar se vincule con un solo toque.');
    } catch {
      Alert.alert('Enlace Directo', url);
    }
  };

  const handleRevokeDevice = (device: ConnectedDevice) => {
    Alert.alert(
      'Desvincular Dispositivo',
      `¿Desea revocar el acceso a "${device.deviceName}"? Dejará de recibir las tomas de este paciente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            if (onRevokeDevice) {
              await onRevokeDevice(device.deviceId);
            } else {
              await defaultCloudSyncService.revokeDevice(effectiveFamilyCode, device.deviceId);
            }
            loadDevices();
            Alert.alert('Dispositivo Desvinculado', `Se revocó el acceso para ${device.deviceName}.`);
          },
        },
      ]
    );
  };

  const handleConnectCaregiver = async () => {
    const code = enteredPairingCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Código Requerido', 'Por favor ingrese el código de enlace del paciente.');
      return;
    }
    if (onConnectFamilyCode) {
      setIsConnecting(true);
      const res = await onConnectFamilyCode(code);
      setIsConnecting(false);
      setPairingSuccessMsg(res.message);
      Alert.alert(res.success ? 'Conexión Exitosa' : 'Aviso de Conexión', res.message);
      if (res.success) {
        setEnteredPairingCode('');
        loadDevices();
      }
    } else {
      Alert.alert('Enlace no disponible', 'No se pudo iniciar el enlace en este dispositivo.');
    }
  };

  const handleScanSuccess = async (scannedCode: string) => {
    setIsScannerVisible(false);
    setEnteredPairingCode(scannedCode);
    if (onConnectFamilyCode) {
      setIsConnecting(true);
      const res = await onConnectFamilyCode(scannedCode);
      setIsConnecting(false);
      setPairingSuccessMsg(res.message);
      Alert.alert(res.success ? 'Conexión Exitosa' : 'Aviso de Conexión', res.message);
      if (res.success) {
        setEnteredPairingCode('');
        loadDevices();
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Cabecera del Modal */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="cog-outline" size={24} color="#0284C7" />
              <Text style={styles.modalTitle}>Configuración, Perfil y Familia</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnClose} accessibilityLabel="Cerrar modal">
              <MaterialCommunityIcons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* SECCIÓN 0: ROL ACTIVO EN ESTE DISPOSITIVO */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="badge-account-horizontal" size={20} color="#7C3AED" />
                <Text style={styles.sectionTitle}>Modo de Operación en este Dispositivo</Text>
              </View>

              <Text style={styles.sectionDesc}>
                Indique quién utiliza este teléfono para adaptar los botones y niveles de seguridad:
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    activeRole === 'patient' && styles.roleCardActive,
                  ]}
                  onPress={() => onSelectRole('patient')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="account-heart"
                    size={28}
                    color={activeRole === 'patient' ? '#0284C7' : '#64748B'}
                  />
                  <Text style={[styles.roleCardTitle, activeRole === 'patient' && styles.roleCardTitleActive]}>
                    Soy el Paciente
                  </Text>
                  <Text style={styles.roleCardSub}>
                    Botones gigantes (54dp), lectura por voz y botiquín protegido.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    activeRole === 'caregiver' && styles.roleCardActive,
                  ]}
                  onPress={() => onSelectRole('caregiver')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={28}
                    color={activeRole === 'caregiver' ? '#059669' : '#64748B'}
                  />
                  <Text style={[styles.roleCardTitle, activeRole === 'caregiver' && styles.roleCardTitleActive]}>
                    Soy el Cuidador
                  </Text>
                  <Text style={styles.roleCardSub}>
                    Gestión total del botiquín, informes clínicos y adherencia.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECCIÓN 1: VINCULACIÓN FAMILIAR MULTI-DISPOSITIVO (PAIRING) */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="cellphone-link" size={20} color="#0284C7" />
                <Text style={styles.sectionTitle}>1. Enlace Familiar Multi-Dispositivo</Text>
              </View>

              <Text style={styles.sectionDesc}>
                Conecte el teléfono de la cuidadora o hijos al de Don Manuel para recibir confirmaciones de tomas en vivo, supervisar el stock y gestionar el botiquín en tiempo real.
              </Text>

              {/* Selector de Modo de Vinculación: QR vs Código */}
              <View style={styles.pairingTabRow}>
                <TouchableOpacity
                  style={[styles.pairingTabBtn, pairingTab === 'qr' && styles.pairingTabBtnActive]}
                  onPress={() => setPairingTab('qr')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={16}
                    color={pairingTab === 'qr' ? '#FFFFFF' : '#475569'}
                  />
                  <Text style={[styles.pairingTabBtnText, pairingTab === 'qr' && styles.pairingTabBtnTextActive]}>
                    Código QR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pairingTabBtn, pairingTab === 'code' && styles.pairingTabBtnActive]}
                  onPress={() => setPairingTab('code')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="form-textbox"
                    size={16}
                    color={pairingTab === 'code' ? '#FFFFFF' : '#475569'}
                  />
                  <Text style={[styles.pairingTabBtnText, pairingTab === 'code' && styles.pairingTabBtnTextActive]}>
                    Código de texto
                  </Text>
                </TouchableOpacity>
              </View>

              {pairingTab === 'qr' ? (
                <View style={styles.qrContainer}>
                  {isLoadingQr ? (
                    <ActivityIndicator size="large" color="#0284C7" style={{ marginVertical: 40 }} />
                  ) : qrDataUrl ? (
                    <Image source={{ uri: qrDataUrl }} style={styles.qrImage} resizeMode="contain" />
                  ) : null}

                  <Text style={styles.qrHintText}>
                    Apunte con la cámara del celular hacia este código QR para abrir y conectar AcompañaMed de forma directa.
                  </Text>

                  <TouchableOpacity style={styles.btnCopyLink} onPress={handleCopyDirectLink} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="link-variant" size={16} color="#0284C7" />
                    <Text style={styles.btnCopyLinkText}>Copiar enlace directo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Tarjeta del Código de Don Manuel */
                <View style={styles.pairingCodeCard}>
                  <Text style={styles.pairingCodeLabel}>CÓDIGO ÚNICO DE ESTE PACIENTE:</Text>
                  <Text style={styles.pairingCodeValue}>{effectiveFamilyCode}</Text>
                  {lastSyncTime ? (
                    <Text style={{ fontSize: 10, color: '#38BDF8', marginTop: 2, marginBottom: 6 }}>
                      Sincronizado en la nube: {lastSyncTime}
                    </Text>
                  ) : null}
                  <TouchableOpacity style={styles.btnCopyCode} onPress={handleCopyCode} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="content-copy" size={16} color="#FFFFFF" />
                    <Text style={styles.btnCopyCodeText}>Copiar código familiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnCopyCode}
                    disabled={isConnecting || isSyncing}
                    accessibilityRole="button"
                    onPress={async () => {
                      if (!onConnectFamilyCode) return;
                      setIsConnecting(true);
                      try {
                        const result = await onConnectFamilyCode(effectiveFamilyCode);
                        setPairingSuccessMsg(result.message);
                        Alert.alert(result.success ? 'Enlace activado' : 'No se pudo activar', result.message);
                        loadDevices();
                      } finally {
                        setIsConnecting(false);
                      }
                    }}
                  >
                    <Text style={styles.btnCopyCodeText}>
                      {isConnecting ? 'Conectando…' : 'Activar enlace de este botiquín'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* LISTA DE DISPOSITIVOS VINCULADOS A ESTA FAMILIA */}
              <View style={styles.devicesHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="devices" size={18} color="#0284C7" />
                  <Text style={styles.devicesTitle}>
                    Dispositivos Vinculados ({connectedDevices.length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={loadDevices}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="refresh" size={16} color="#0284C7" />
                  <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: '700' }}>Actualizar</Text>
                </TouchableOpacity>
              </View>

              {isLoadingDevices ? (
                <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 12 }} />
              ) : connectedDevices.length === 0 ? (
                <View style={styles.emptyDevicesCard}>
                  <MaterialCommunityIcons name="cellphone-information" size={20} color="#94A3B8" />
                  <Text style={styles.emptyDevicesText}>
                    Aún no hay otros dispositivos registrados. Escanee el código QR o ingrese el código desde el otro teléfono para vincularlo.
                  </Text>
                </View>
              ) : (
                connectedDevices.map((dev) => {
                  const isCurrent = dev.deviceId === currentDeviceId;
                  const status = formatDeviceActivityStatus(dev.lastSeen);
                  return (
                    <View key={dev.deviceId} style={styles.deviceCard}>
                      <View style={styles.deviceLeftCol}>
                        <View style={styles.deviceIconCircle}>
                          <MaterialCommunityIcons
                            name={dev.role === 'patient' ? 'account-heart' : 'shield-account'}
                            size={20}
                            color={dev.role === 'patient' ? '#0284C7' : '#059669'}
                          />
                        </View>
                        <View style={styles.deviceInfoCol}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.deviceNameText}>{dev.deviceName}</Text>
                            {isCurrent && (
                              <View style={styles.thisDeviceBadge}>
                                <Text style={styles.thisDeviceText}>Este celular</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.deviceMetaText}>
                            {dev.role === 'patient' ? 'Paciente' : 'Cuidador'} · {dev.platform || 'Móvil'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.deviceRightCol}>
                        <View style={[styles.deviceStatusBadge, { backgroundColor: `${status.badgeColor}15` }]}>
                          <View style={[styles.statusDot, { backgroundColor: status.badgeColor }]} />
                          <Text style={[styles.deviceStatusText, { color: status.badgeColor }]}>
                            {status.statusLabel}
                          </Text>
                        </View>
                        {!isCurrent && (
                          <TouchableOpacity
                            style={styles.btnRevokeDevice}
                            onPress={() => handleRevokeDevice(dev)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.btnRevokeDeviceText}>Desvincular</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}

              {/* Campo para conectar desde el celular del cuidador */}
              <View style={styles.connectCaregiverBox}>
                <Text style={styles.inputLabel}>Enlazar este teléfono al paciente:</Text>
                <View style={styles.inputWithButtonRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, textTransform: 'uppercase' }]}
                    placeholder="Ej. MED-MANU-82"
                    placeholderTextColor="#94A3B8"
                    value={enteredPairingCode}
                    onChangeText={setEnteredPairingCode}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.btnScanCamera}
                    onPress={() => setIsScannerVisible(true)}
                    activeOpacity={0.85}
                    accessibilityLabel="Escanear código QR con la cámara"
                  >
                    <MaterialCommunityIcons name="camera-outline" size={16} color="#0284C7" />
                    <Text style={styles.btnScanCameraText}>Escanear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnConnect, isConnecting && { opacity: 0.6 }]}
                    onPress={handleConnectCaregiver}
                    disabled={isConnecting}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnConnectText}>
                      {isConnecting ? 'Conectando...' : 'Conectar'}
                    </Text>
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
                <MaterialCommunityIcons name="bell-check-outline" size={18} color="#FFFFFF" />
                <Text style={styles.btnTestNotificationText}>
                  Disparar notificación de prueba
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <CameraQrScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScanSuccess={handleScanSuccess}
      />
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
  roleCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
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
  roleCardSub: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
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
  btnScanCamera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
  },
  btnScanCameraText: {
    color: '#0284C7',
    fontSize: 12.5,
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
  pairingTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  pairingTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pairingTabBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  pairingTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pairingTabBtnTextActive: {
    color: '#FFFFFF',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  qrImage: {
    width: 210,
    height: 210,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  qrHintText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  btnCopyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 10,
  },
  btnCopyLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  devicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  devicesTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyDevicesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  emptyDevicesText: {
    flex: 1,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 15,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  deviceLeftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deviceInfoCol: {
    flex: 1,
  },
  deviceNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  thisDeviceBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  thisDeviceText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  deviceMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  deviceRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deviceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deviceStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  btnRevokeDevice: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    marginTop: 2,
  },
  btnRevokeDeviceText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#DC2626',
  },
});
