import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmergencyProfile } from '../../domain';
import {
  generateQrDataUrl,
  buildPairingUrl,
  buildMemorableFamilyCode,
  defaultCloudSyncService,
  ConnectedDevice,
} from '../../infrastructure';
import { CameraQrScannerModal } from './CameraQrScannerModal';
import { FamilySyncSection } from './pairing/FamilySyncSection';
import { PatientProfileSection } from './pairing/PatientProfileSection';
import { pairingStyles as styles } from './pairing/pairingStyles';
import { showNotice, askConfirmation } from '../../data/initialData';

interface Props {
  visible: boolean;
  onClose: () => void;
  emergencyProfile: EmergencyProfile;
  onUpdateProfile: (updated: EmergencyProfile) => void;
  onClearDemoData?: () => void;
  onRestoreDemoData?: () => void;
  onTestNotification?: () => void;
  activeRole: 'patient' | 'caregiver';
  onSelectRole: (role: 'patient' | 'caregiver') => void;
  familyCode?: string;
  onConnectFamilyCode?: (code: string) => Promise<{ success: boolean; message: string }>;
  isSyncing?: boolean;
  lastSyncTime?: string;
  currentDeviceId?: string;
  onRevokeDevice?: (deviceId: string) => Promise<boolean>;
  onResetDevice?: () => Promise<void> | void;
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
  onResetDevice,
}) => {
  const [patientName, setPatientName] = useState(emergencyProfile?.patientFullName || '');
  const [patientPhone, setPatientPhone] = useState(emergencyProfile?.patientPhone || '');
  const [age, setAge] = useState(String(emergencyProfile?.age || ''));
  const [bloodType, setBloodType] = useState(emergencyProfile?.bloodType || '');
  const [allergiesText, setAllergiesText] = useState((emergencyProfile?.allergies || []).join(', '));
  const [caregiverName, setCaregiverName] = useState(emergencyProfile?.emergencyContact?.name || '');
  const [caregiverPhone, setCaregiverPhone] = useState(emergencyProfile?.emergencyContact?.phone || '');

  const [enteredPairingCode, setEnteredPairingCode] = useState('');
  const [pairingSuccessMsg, setPairingSuccessMsg] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Estados de QR, escáner y dispositivos conectados
  const [pairingTab, setPairingTab] = useState<'qr' | 'code'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(false);
  const [isScannerVisible, setIsScannerVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) return;
    setPatientName(emergencyProfile?.patientFullName || '');
    setPatientPhone(emergencyProfile?.patientPhone || '');
    setAge(emergencyProfile?.age ? String(emergencyProfile.age) : '');
    setBloodType(emergencyProfile?.bloodType || '');
    setAllergiesText((emergencyProfile?.allergies || []).join(', '));
    setCaregiverName(emergencyProfile?.emergencyContact?.name || '');
    setCaregiverPhone(emergencyProfile?.emergencyContact?.phone || '');
  }, [visible, emergencyProfile]);

  const generatedCode = buildMemorableFamilyCode(patientName, age);
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
      patientFullName: patientName.trim() || 'Paciente',
      patientPhone: patientPhone.trim(),
      age: /^\d+$/.test(age.trim()) ? Number(age) : 0,
      bloodType: bloodType.trim(),
      allergies: allergiesText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      chronicConditions: emergencyProfile?.chronicConditions || [],
      healthInsurance: emergencyProfile?.healthInsurance || '',
      emergencyContact: {
        ...(emergencyProfile?.emergencyContact || {}),
        name: caregiverName.trim(),
        phone: caregiverPhone.trim(),
        relationship: emergencyProfile?.emergencyContact?.relationship || 'Cuidador',
      },
    };

    onUpdateProfile(updated);
    showNotice('Perfil Guardado', 'Los datos del paciente y cuidador fueron actualizados en la base de datos local.');
  };

  const handleCopyCode = () => {
    try {
      Clipboard.setString(effectiveFamilyCode);
      showNotice('Código Copiado', `El código de enlace familiar "${effectiveFamilyCode}" fue copiado al portapapeles.`);
    } catch {
      showNotice('Código Familiar', `Su código es: ${effectiveFamilyCode}`);
    }
  };

  const handleCopyDirectLink = () => {
    const url = buildPairingUrl(effectiveFamilyCode);
    try {
      Clipboard.setString(url);
      showNotice('Enlace Copiado', 'El enlace directo fue copiado. Puede enviarlo por WhatsApp para que su familiar se vincule con un solo toque.');
    } catch {
      showNotice('Enlace Directo', url);
    }
  };

  const handleRevokeDevice = (device: ConnectedDevice) => {
    askConfirmation(
      'Desvincular Dispositivo',
      `¿Desea revocar el acceso a "${device.deviceName}"? Dejará de recibir las tomas de este paciente.`,
      async () => {
        // Actualización optimista inmediata en la UI
        setConnectedDevices((prev) => prev.filter((d) => d.deviceId !== device.deviceId));
        if (onRevokeDevice) {
          await onRevokeDevice(device.deviceId);
        } else {
          await defaultCloudSyncService.revokeDevice(effectiveFamilyCode, device.deviceId);
        }
        await loadDevices();
        showNotice('Dispositivo Desvinculado', `Se revocó el acceso para ${device.deviceName}.`);
      },
      'Desvincular',
      'Cancelar'
    );
  };

  const handleConnectCaregiver = async () => {
    const code = enteredPairingCode.trim().toUpperCase();
    if (!code) {
      showNotice('Código Requerido', 'Por favor ingrese el código de enlace del paciente.');
      return;
    }
    if (onConnectFamilyCode) {
      setIsConnecting(true);
      const res = await onConnectFamilyCode(code);
      setIsConnecting(false);
      setPairingSuccessMsg(res.message);
      showNotice(res.success ? 'Conexión Exitosa' : 'Aviso de Conexión', res.message);
      if (res.success) {
        setEnteredPairingCode('');
        loadDevices();
      }
    } else {
      showNotice('Enlace no disponible', 'No se pudo iniciar el enlace en este dispositivo.');
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
      showNotice(res.success ? 'Conexión Exitosa' : 'Aviso de Conexión', res.message);
      if (res.success) {
        setEnteredPairingCode('');
        loadDevices();
      }
    }
  };

  const handleConfirmUnlinkDevice = () => {
    askConfirmation(
      '¿Desvincular este dispositivo?',
      `Este teléfono se desvinculará de la familia y volverá a la pantalla inicial de bienvenida.\n\nSus datos médicos permanecen respaldados en la nube bajo el código [${effectiveFamilyCode}]. Podrá volver a conectarse o cambiar de rol en cualquier momento.`,
      async () => {
        if (onResetDevice) {
          await onResetDevice();
        }
      },
      'Sí, desvincular',
      'Cancelar'
    );
  };

  const handleToggleRole = () => {
    const nextRole = activeRole === 'patient' ? 'caregiver' : 'patient';
    const roleLabel = nextRole === 'patient' ? 'Paciente (Don Manuel)' : 'Cuidador / Familiar';
    askConfirmation(
      '¿Cambiar el rol de este dispositivo?',
      `Este teléfono pasará al modo ${roleLabel}.\n\nSe conservarán todos los datos del paciente y el código de enlace familiar [${effectiveFamilyCode}].`,
      () => {
        if (onSelectRole) {
          onSelectRole(nextRole);
          showNotice('Rol Actualizado', `Este teléfono ahora opera en modo ${roleLabel}.`);
        }
      },
      'Sí, cambiar rol',
      'Cancelar'
    );
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
            {/* IDENTIDAD DEL DISPOSITIVO */}
            <View style={styles.deviceIdentityCard}>
              <View style={styles.deviceIdentityHeader}>
                <MaterialCommunityIcons
                  name={activeRole === 'patient' ? 'account-heart' : 'shield-account'}
                  size={20}
                  color={activeRole === 'patient' ? '#0284C7' : '#059669'}
                />
                <Text style={styles.deviceIdentityTitle}>
                  {activeRole === 'patient'
                    ? 'Este teléfono opera en Modo Paciente'
                    : 'Este teléfono opera en Modo Cuidador'}
                </Text>
              </View>
              <Text style={styles.deviceIdentityDesc}>
                {activeRole === 'patient'
                  ? 'Configurado con interfaz adaptada para el paciente (botones grandes, lectura de voz y pastillero protegido).'
                  : 'Configurado para supervisión remota, gestión de recetas médicas, control de stock y reportes.'}
              </Text>

              <TouchableOpacity
                style={styles.btnSwitchDeviceRole}
                onPress={handleToggleRole}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Cambiar el rol de este teléfono"
              >
                <MaterialCommunityIcons name="swap-horizontal-bold" size={16} color="#0F172A" />
                <Text style={styles.btnSwitchDeviceRoleText}>
                  {activeRole === 'patient'
                    ? 'Cambiar este teléfono a Modo Cuidador'
                    : 'Cambiar este teléfono a Modo Paciente'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN 1: VINCULACIÓN FAMILIAR MULTI-DISPOSITIVO */}
            <FamilySyncSection
              effectiveFamilyCode={effectiveFamilyCode}
              lastSyncTime={lastSyncTime}
              pairingTab={pairingTab}
              setPairingTab={setPairingTab}
              isLoadingQr={isLoadingQr}
              qrDataUrl={qrDataUrl}
              onCopyDirectLink={handleCopyDirectLink}
              onCopyCode={handleCopyCode}
              onActivateFamilyCode={async () => {
                if (!onConnectFamilyCode) return;
                setIsConnecting(true);
                try {
                  const result = await onConnectFamilyCode(effectiveFamilyCode);
                  setPairingSuccessMsg(result.message);
                  showNotice(result.success ? 'Enlace activado' : 'No se pudo activar', result.message);
                  loadDevices();
                } finally {
                  setIsConnecting(false);
                }
              }}
              isConnecting={isConnecting}
              isSyncing={isSyncing}
              connectedDevices={connectedDevices}
              isLoadingDevices={isLoadingDevices}
              currentDeviceId={currentDeviceId}
              onRefreshDevices={loadDevices}
              onRevokeDevice={handleRevokeDevice}
              enteredPairingCode={enteredPairingCode}
              setEnteredPairingCode={setEnteredPairingCode}
              onConnectCaregiver={handleConnectCaregiver}
              onOpenScanner={() => setIsScannerVisible(true)}
              pairingSuccessMsg={pairingSuccessMsg}
            />

            {/* SECCIÓN 2: PERSONALIZAR DATOS REALES */}
            <PatientProfileSection
              patientName={patientName}
              setPatientName={setPatientName}
              patientPhone={patientPhone}
              setPatientPhone={setPatientPhone}
              age={age}
              setAge={setAge}
              bloodType={bloodType}
              setBloodType={setBloodType}
              allergiesText={allergiesText}
              setAllergiesText={setAllergiesText}
              caregiverName={caregiverName}
              setCaregiverName={setCaregiverName}
              caregiverPhone={caregiverPhone}
              setCaregiverPhone={setCaregiverPhone}
              onSaveProfile={handleSaveProfile}
            />

            {/* SECCIÓN 3: ZONA ADMINISTRATIVA DEL DISPOSITIVO */}
            <View style={styles.adminSectionCard}>
              <View style={styles.adminSectionHeader}>
                <MaterialCommunityIcons name="cellphone-cog" size={18} color="#991B1B" />
                <Text style={styles.adminSectionTitle}>Zona Administrativa del Dispositivo</Text>
              </View>
              <Text style={styles.adminSectionDesc}>
                Si este teléfono cambiará de dueño o pasa de cuidador a paciente, puede desvincularlo. Los datos de la medicación seguirán seguros en la nube con su código familiar ({effectiveFamilyCode}).
              </Text>
              <TouchableOpacity
                style={styles.btnResetDevice}
                onPress={handleConfirmUnlinkDevice}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Desvincular este teléfono y volver al inicio"
              >
                <MaterialCommunityIcons name="logout-variant" size={16} color="#DC2626" />
                <Text style={styles.btnResetDeviceText}>Desvincular y cambiar de usuario / rol</Text>
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
