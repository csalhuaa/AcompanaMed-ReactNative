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
  defaultCloudSyncService,
  ConnectedDevice,
} from '../../infrastructure';
import { CameraQrScannerModal } from './CameraQrScannerModal';
import { RoleSelectorSection } from './pairing/RoleSelectorSection';
import { FamilySyncSection } from './pairing/FamilySyncSection';
import { PatientProfileSection } from './pairing/PatientProfileSection';
import { DemoScenariosSection } from './pairing/DemoScenariosSection';
import { NotificationDiagnosticSection } from './pairing/NotificationDiagnosticSection';
import { pairingStyles as styles } from './pairing/pairingStyles';

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
  const [patientName, setPatientName] = useState(emergencyProfile?.patientFullName || '');
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
    setAge(emergencyProfile?.age ? String(emergencyProfile.age) : '');
    setBloodType(emergencyProfile?.bloodType || '');
    setAllergiesText((emergencyProfile?.allergies || []).join(', '));
    setCaregiverName(emergencyProfile?.emergencyContact?.name || '');
    setCaregiverPhone(emergencyProfile?.emergencyContact?.phone || '');
  }, [visible, emergencyProfile]);

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

      // Asegurar que el código que se está mostrando en el QR esté 100% activo en Firebase
      if (onConnectFamilyCode) {
        onConnectFamilyCode(effectiveFamilyCode).then(() => {
          if (isMounted) loadDevices();
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [visible, effectiveFamilyCode]);

  const handleSaveProfile = () => {
    const updated: EmergencyProfile = {
      patientFullName: patientName.trim() || 'Paciente',
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
            <RoleSelectorSection activeRole={activeRole} onSelectRole={onSelectRole} />

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
                  Alert.alert(result.success ? 'Enlace activado' : 'No se pudo activar', result.message);
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

            {/* SECCIÓN 3: SELECTOR DE ESCENARIO */}
            <DemoScenariosSection
              onClearDemoData={onClearDemoData}
              onRestoreDemoData={onRestoreDemoData}
            />

            {/* SECCIÓN 4: DIAGNÓSTICO DE NOTIFICACIONES */}
            <NotificationDiagnosticSection onTestNotification={onTestNotification} />
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
