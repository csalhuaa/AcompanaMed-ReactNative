import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  AppState,
  useWindowDimensions,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Medicine,
  DoseLog,
  ActorRole,
  EmergencyProfile,
  canRegisterDose,
  decrementStock,
  calculateAdherence,
  evaluateEscalation,
  buildDailySchedule,
  generateClinicalSummary,
} from './src/domain';
import {
  defaultStorageService,
  defaultSpeechService,
  defaultHapticService,
  defaultNotificationService,
  formatConfirmationSpeech,
  CommunicationService,
  defaultCloudSyncService,
  FamilySyncPayload,
  sanitizeFamilyCode,
  isStateNewer,
} from './src/infrastructure';
import {
  AppNavTab,
  BottomNavBar,
  TodayTimelineStream,
  CaregiverDashboard,
  MedicineInventoryPanel,
  EmergencyProfileCard,
  AddMedicineModal,
  ClinicalReportModal,
  ConfirmDialogModal,
  RestockModal,
  FamilyPairingModal,
  PillInspectionModal,
  OnboardingModal,
  NewMedicineData,
} from './src/components';
import { createEmptyProfile, getScheduleEscalation, getScheduledDate } from './src/domain/LocalWorkflow';

// Catálogo inicial con polifarmacia geriátrica real y fotos de blísteres
const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-losartan',
    name: 'Losartán Potásico',
    doseDescription: '50 mg',
    intervalHours: 24,
    instructions: 'Tomar con medio vaso de agua después del desayuno.',
    visualPill: {
      shape: 'scored',
      colorHex: '#38BDF8',
      colorName: 'Azul Celeste',
      imprint: '50',
      sizeCategory: 'medium',
      sizeLabel: 'Mediana (~9 mm)',
      canSplit: true,
      intakeAdvice: 'Tomar con abundante agua. Se puede partir en dos por la ranura central si el médico lo indicó.',
      photoUri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    },
    stock: 14,
    minStockAlert: 6,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
  {
    id: 'med-metformina',
    name: 'Metformina',
    doseDescription: '850 mg',
    intervalHours: 24,
    instructions: 'Tomar inmediatamente con el almuerzo para proteger la mucosa gástrica.',
    visualPill: {
      shape: 'oval',
      colorHex: '#F1F5F9',
      colorName: 'Blanco Tiza',
      imprint: '850',
      sizeCategory: 'large',
      sizeLabel: 'Grande (~19 mm)',
      canSplit: false,
      intakeAdvice: 'No masticar ni triturar. Tomar con alimentos para reducir las molestias estomacales.',
      photoUri: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
    },
    stock: 22,
    minStockAlert: 5,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
  {
    id: 'med-atorvastatina',
    name: 'Atorvastatina',
    doseDescription: '20 mg',
    intervalHours: 24,
    instructions: 'Tomar antes de acostarse a dormir.',
    visualPill: {
      shape: 'round',
      colorHex: '#F59E0B',
      colorName: 'Ámbar Cálido',
      imprint: '20',
      sizeCategory: 'medium',
      sizeLabel: 'Mediana (~10 mm)',
      canSplit: false,
      intakeAdvice: 'Tomar por la noche. Ayuda a regular los niveles de colesterol durante el descanso.',
      photoUri: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
    },
    stock: 4,
    minStockAlert: 6,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
];

const INITIAL_SCHEDULE_TIMES: Record<string, string> = {
  'med-losartan': '08:00',
  'med-metformina': '13:00',
  'med-atorvastatina': '21:00',
};

const INITIAL_LOGS: DoseLog[] = [
  {
    id: 'log-hist-1',
    medicineId: 'med-losartan',
    scheduledTime: '2026-10-28T08:00:00.000Z',
    takenTime: '2026-10-28T08:05:00.000Z',
    status: 'taken',
    registeredBy: 'patient',
  },
  {
    id: 'log-hist-2',
    medicineId: 'med-metformina',
    scheduledTime: '2026-10-28T13:00:00.000Z',
    takenTime: '2026-10-28T13:10:00.000Z',
    status: 'taken',
    registeredBy: 'patient',
  },
  {
    id: 'log-hist-3',
    medicineId: 'med-atorvastatina',
    scheduledTime: '2026-10-28T21:00:00.000Z',
    takenTime: '2026-10-28T21:15:00.000Z',
    status: 'taken',
    registeredBy: 'caregiver',
  },
];

const DEFAULT_PROFILE: EmergencyProfile = {
  patientFullName: 'Manuel Jesús Alhua',
  age: 74,
  bloodType: 'O+',
  allergies: ['Penicilina', 'Ibuprofeno (AINEs)'],
  chronicConditions: ['Hipertensión Arterial Primaria', 'Diabetes Mellitus Tipo 2'],
  healthInsurance: 'EsSalud - Policlínico Yanahuara',
  emergencyContact: {
    name: 'María Alhua',
    relationship: 'Hija / Cuidadora Principal',
    phone: '+51 954 123 456',
  },
};

function showNotice(title: string, message?: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert([title, message].filter(Boolean).join('\n\n'));
  } else {
    Alert.alert(title, message);
  }
}

function MainApp() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isDesktop = width >= 1024;
  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : insets.top;
  const topInset = Math.max(insets.top, statusBarHeight);

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<AppNavTab>('today');
  const [activeRole, setActiveRole] = useState<ActorRole>('caregiver');
  const [desktopLayoutMode, setDesktopLayoutMode] = useState<'mobile_shell' | 'desktop_split'>('mobile_shell');

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [emergencyProfile, setEmergencyProfile] = useState<EmergencyProfile>(createEmptyProfile());
  const [expandedMedId, setExpandedMedId] = useState<string>('');
  const [now, setNow] = useState(() => new Date());
  const [isOnboardingBusy, setIsOnboardingBusy] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const doseActionBusy = useRef(false);

  // Estados de Modales y Acciones
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  const [isRestockModalVisible, setIsRestockModalVisible] = useState(false);
  const [restockingMedicine, setRestockingMedicine] = useState<Medicine | null>(null);

  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);

  const [isFamilyPairingModalVisible, setIsFamilyPairingModalVisible] = useState(false);
  const [inspectingMedicine, setInspectingMedicine] = useState<Medicine | null>(null);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);

  // Estados de Sincronización en la Nube (Multi-Dispositivo)
  const [familyCode, setFamilyCode] = useState<string>('');
  const [isFamilyConnected, setIsFamilyConnected] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string>('');

  // Referencia mutable para sincronización atómica sin stale closures
  const localStateRef = useRef({
    medicines,
    logs,
    scheduleTimes,
    emergencyProfile,
    lastUpdateIso: new Date().toISOString(),
  });

  useEffect(() => {
    localStateRef.current = {
      medicines,
      logs,
      scheduleTimes,
      emergencyProfile,
      lastUpdateIso: localStateRef.current.lastUpdateIso,
    };
  }, [medicines, logs, scheduleTimes, emergencyProfile]);

  const handleUpdateMedicinePhoto = (medicineId: string, newPhotoUri: string) => {
    setMedicines((prev) =>
      prev.map((m) =>
        m.id === medicineId
          ? {
              ...m,
              visualPill: {
                ...m.visualPill,
                photoUri: newPhotoUri,
              },
            }
          : m
      )
    );
  };

  // Carga asíncrona de almacenamiento
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedMeds = await defaultStorageService.loadMedicines([]);
        const storedTimes = await defaultStorageService.loadSchedules({});
        const storedLogs = await defaultStorageService.loadLogs([]);
        const storedProfile = await defaultStorageService.loadEmergencyProfile(createEmptyProfile());
        const storedRole = await defaultStorageService.loadActiveRole('caregiver');
        const storedCode = await defaultStorageService.loadFamilyCode();
        const devId = await defaultStorageService.loadOrCreateDeviceId();
        setDeviceId(devId);

        const defaultCode = `MED-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        const activeCode = storedCode || defaultCode;
        setFamilyCode(activeCode);

        // Inicializar datos locales
        setMedicines(storedMeds);
        setScheduleTimes(storedTimes);
        setLogs(storedLogs);
        setEmergencyProfile(storedProfile);
        setActiveRole(storedRole);

        if (storedCode) {
          setIsFamilyConnected(true);
          const devName = storedRole === 'patient'
            ? `Teléfono de ${storedProfile.patientFullName || 'Don Manuel'} (Paciente)`
            : `Celular de ${storedProfile.emergencyContact?.name || 'Cuidadora'} (Cuidador)`;
          defaultCloudSyncService.registerDevice(activeCode, {
            deviceId: devId,
            role: storedRole,
            deviceName: devName,
            platform: Platform.OS === 'web' ? 'Navegador Web' : Platform.OS === 'android' ? 'Android' : 'iOS',
            connectedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
          });
        }

        const hasCompleted = await defaultStorageService.loadOnboardingCompleted();
        if (!hasCompleted) {
          setIsOnboardingVisible(true);
        }

        if (storedMeds.length > 0) {
          setExpandedMedId(storedMeds[0].id);
        }
      } catch (err) {
        console.warn('Error al cargar datos desde AsyncStorage:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadStoredData();
  }, []);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 30000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  // Persistencia automática
  useEffect(() => {
    if (isLoaded) defaultStorageService.saveMedicines(medicines);
  }, [medicines, isLoaded]);

  useEffect(() => {
    if (isLoaded) defaultStorageService.saveLogs(logs);
  }, [logs, isLoaded]);

  useEffect(() => {
    if (isLoaded) defaultStorageService.saveSchedules(scheduleTimes);
  }, [scheduleTimes, isLoaded]);

  useEffect(() => {
    if (isLoaded) defaultStorageService.saveEmergencyProfile(emergencyProfile);
  }, [emergencyProfile, isLoaded]);

  useEffect(() => {
    if (isLoaded) defaultStorageService.saveActiveRole(activeRole);
  }, [activeRole, isLoaded]);

  // Cálculos de Dominio
  const dailySchedule = buildDailySchedule(medicines, scheduleTimes, logs, now);
  const adherence = calculateAdherence(logs);
  const dailyProgress = dailySchedule.length
    ? Math.round(dailySchedule.filter(item => item.isTakenToday).length / dailySchedule.length * 100)
    : 0;
  const clinicalReport = generateClinicalSummary(medicines, logs, emergencyProfile);

  useEffect(() => {
    if (isLoaded && !isOnboardingVisible) {
      defaultNotificationService.syncDoseReminders(medicines, scheduleTimes).catch(() => {
        console.warn('Reminder synchronization unavailable');
      });
    }
  }, [isLoaded, isOnboardingVisible, medicines, scheduleTimes]);

  // Sincronización transparente con Firebase Realtime Database
  const syncToCloud = async (
    overrideMeds?: Medicine[],
    overrideLogs?: DoseLog[],
    overrideTimes?: Record<string, string>,
    overrideProfile?: EmergencyProfile
  ) => {
    if (!familyCode || !isFamilyConnected) return;
    const nowIso = new Date().toISOString();
    localStateRef.current.lastUpdateIso = nowIso;
    try {
      const payload: FamilySyncPayload = {
        familyCode,
        updatedAt: nowIso,
        updatedBy: activeRole,
        patientName: (overrideProfile || emergencyProfile).patientFullName,
        medicines: overrideMeds || medicines,
        schedules: overrideTimes || scheduleTimes,
        logs: overrideLogs || logs,
        emergencyProfile: overrideProfile || emergencyProfile,
      };
      const success = await defaultCloudSyncService.pushFamilyState(payload);
      if (!success) { setLastCloudSyncTime(''); return; }
      setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn('Sync to cloud error:', e);
    }
  };

  // Sondeo en tiempo real cada 3.5 segundos entre dispositivos
  useEffect(() => {
    if (!isLoaded || !familyCode || !isFamilyConnected || isOnboardingVisible) return;

    const stopPolling = defaultCloudSyncService.startSyncPolling(
      familyCode,
      (cloudData) => {
        if (!cloudData || !cloudData.updatedAt) return;

        const currentLocal = localStateRef.current;
        const cloudTime = new Date(cloudData.updatedAt).getTime();
        const localTime = new Date(currentLocal.lastUpdateIso).getTime();

        const localMedsStr = JSON.stringify(currentLocal.medicines);
        const cloudMedsStr = JSON.stringify(cloudData.medicines || []);
        const localLogsStr = JSON.stringify(currentLocal.logs);
        const cloudLogsStr = JSON.stringify(cloudData.logs || []);
        const localTimesStr = JSON.stringify(currentLocal.scheduleTimes);
        const cloudTimesStr = JSON.stringify(cloudData.schedules || {});

        const hasDifference =
          localMedsStr !== cloudMedsStr ||
          localLogsStr !== cloudLogsStr ||
          localTimesStr !== cloudTimesStr ||
          JSON.stringify(currentLocal.emergencyProfile) !== JSON.stringify(cloudData.emergencyProfile);

        if (hasDifference && cloudTime >= localTime) {
          localStateRef.current.lastUpdateIso = cloudData.updatedAt;
          setMedicines(cloudData.medicines || []);
          setScheduleTimes(cloudData.schedules || {});
          setLogs(cloudData.logs || []);
          if (cloudData.emergencyProfile) {
            setEmergencyProfile(cloudData.emergencyProfile);
          }
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }

        // Heartbeat para registrar este dispositivo como activo en vivo
        if (deviceId) {
          defaultCloudSyncService.updateDeviceHeartbeat(familyCode, deviceId);
        }
      },
      3500
    );

    return () => stopPolling();
  }, [isLoaded, familyCode, isFamilyConnected, isOnboardingVisible, deviceId]);

  const handleRevokeDevice = async (targetDeviceId: string): Promise<boolean> => {
    if (!familyCode) return false;
    return await defaultCloudSyncService.revokeDevice(familyCode, targetDeviceId);
  };

  // Detección automática de emparejamiento por Código QR (?pair=CODIGO)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && isLoaded) {
      try {
        const params = new URLSearchParams(window.location.search);
        const pairParam = params.get('pair');
        if (pairParam) {
          const clean = sanitizeFamilyCode(pairParam);
          if (clean) {
            handleConnectFamilyCode(clean, 'caregiver');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (err) {
        console.warn('URL pair param error:', err);
      }
    }
  }, [isLoaded]);

  const handleConnectFamilyCode = async (
    targetCode: string,
    connectingRole: ActorRole = activeRole
  ): Promise<{ success: boolean; message: string }> => {
    const clean = sanitizeFamilyCode(targetCode);
    if (!clean) return { success: false, message: 'Por favor ingrese un código válido.' };

    setIsCloudSyncing(true);
    try {
      const cloudData = await defaultCloudSyncService.fetchFamilyState(clean);
      if (!cloudData) {
        if (connectingRole === 'caregiver' && clean !== familyCode) {
          setIsCloudSyncing(false);
          return {
            success: false,
            message: `No se encontró ningún paciente con el código [${clean}]. Verifique que el paciente tenga AcompañaMed abierto con dicho código.`,
          };
        }

        // El código no existía aún en la nube y es Paciente: lo creamos con el estado actual
        const nowIso = new Date().toISOString();
        const payload: FamilySyncPayload = {
          familyCode: clean,
          updatedAt: nowIso,
          updatedBy: connectingRole,
          patientName: emergencyProfile.patientFullName,
          medicines,
          schedules: scheduleTimes,
          logs,
          emergencyProfile,
        };
        const saved = await defaultCloudSyncService.pushFamilyState(payload);
        if (!saved) return { success: false, message: 'No se pudo activar el enlace. Sus datos siguen guardados en este teléfono.' };
        setFamilyCode(clean);
        await defaultStorageService.saveFamilyCode(clean);
        setIsFamilyConnected(true);
        localStateRef.current.lastUpdateIso = nowIso;

        if (deviceId) {
          const devName = connectingRole === 'patient'
            ? `Teléfono de ${emergencyProfile.patientFullName || 'Don Manuel'} (Paciente)`
            : `Celular de ${emergencyProfile.emergencyContact?.name || 'Cuidadora'} (Cuidador)`;
          defaultCloudSyncService.registerDevice(clean, {
            deviceId,
            role: connectingRole,
            deviceName: devName,
            platform: Platform.OS === 'web' ? 'Navegador Web' : Platform.OS === 'android' ? 'Android' : 'iOS',
            connectedAt: nowIso,
            lastSeen: nowIso,
          });
        }

        setIsCloudSyncing(false);
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return {
          success: true,
          message: `Código [${clean}] activado en Firebase. Comparta este código con el otro dispositivo.`,
        };
      }

      // El código ya existe en la nube: descargar y sincronizar todo
      const downloadedMeds = cloudData.medicines || [];
      const downloadedSchedules = cloudData.schedules || {};
      const downloadedLogs = cloudData.logs || [];
      const downloadedProfile = cloudData.emergencyProfile || emergencyProfile;

      setMedicines(downloadedMeds);
      setScheduleTimes(downloadedSchedules);
      setLogs(downloadedLogs);
      if (cloudData.emergencyProfile) {
        setEmergencyProfile(downloadedProfile);
        await defaultStorageService.saveEmergencyProfile(downloadedProfile);
      }
      setFamilyCode(clean);
      await defaultStorageService.saveFamilyCode(clean);
      setIsFamilyConnected(true);
      await defaultStorageService.saveMedicines(downloadedMeds);
      await defaultStorageService.saveSchedules(downloadedSchedules);
      await defaultStorageService.saveLogs(downloadedLogs);
      if (downloadedMeds.length > 0) {
        setExpandedMedId(downloadedMeds[0].id);
      }

      localStateRef.current = {
        medicines: downloadedMeds,
        logs: downloadedLogs,
        scheduleTimes: downloadedSchedules,
        emergencyProfile: downloadedProfile,
        lastUpdateIso: cloudData.updatedAt || new Date().toISOString(),
      };

      if (deviceId) {
        const devName = connectingRole === 'patient'
          ? `Teléfono de ${downloadedProfile.patientFullName || 'Don Manuel'} (Paciente)`
          : `Celular de ${downloadedProfile.emergencyContact?.name || 'Cuidadora'} (Cuidador)`;
        defaultCloudSyncService.registerDevice(clean, {
          deviceId,
          role: connectingRole,
          deviceName: devName,
          platform: Platform.OS === 'web' ? 'Navegador Web' : Platform.OS === 'android' ? 'Android' : 'iOS',
          connectedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
      }

      setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsCloudSyncing(false);
      return {
        success: true,
        message: `¡Conectado exitosamente con ${cloudData.patientName}! Se descargaron ${downloadedMeds.length} medicamentos y el historial médico en tiempo real.`,
      };
    } catch {
      setIsCloudSyncing(false);
      return {
        success: false,
        message: 'No se pudo conectar al servidor de Firebase. Verifique su conexión a internet.',
      };
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const escalation = getScheduleEscalation(dailySchedule, now);

  // Acción: Confirmar toma de pastilla
  const handleTakeDose = (medId: string, actor: ActorRole = activeRole) => {
    if (doseActionBusy.current) return;
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;
    if (dailySchedule.find(item => item.medicine.id === medId)?.isTakenToday) {
      showNotice('Toma ya registrada', 'Esta dosis diaria ya fue confirmada hoy.');
      return;
    }
    if (med.stock <= 0) {
      showNotice('Sin existencias', 'Reponga este medicamento antes de registrar la toma.');
      return;
    }

    const check = canRegisterDose(medId, logs, new Date());
    if (!check.allowed) {
      showNotice('Protección de Seguridad Médica', check.reason);
      return;
    }

    doseActionBusy.current = true;
    const updated = decrementStock(med, 1);
    const newMeds = medicines.map((m) => (m.id === updated.id ? updated : m));

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medId,
      scheduledTime: getScheduledDate(scheduleTimes[medId] || '08:00', new Date()).toISOString(),
      takenTime: new Date().toISOString(),
      status: 'taken',
      registeredBy: actor,
    };
    const newLogs = [newLog, ...logs];

    setMedicines(newMeds);
    setLogs(newLogs);
    setTimeout(() => { doseActionBusy.current = false; }, 500);
    defaultNotificationService.cancelSnoozeReminder(medId).catch(() => {
      showNotice('Aviso pendiente', 'La toma se guardó, pero no se pudo cancelar el aviso pospuesto.');
    });
    syncToCloud(newMeds, newLogs);

    if (actor === 'patient') {
      defaultHapticService.vibrateSuccess();
      defaultSpeechService.speak(formatConfirmationSpeech(emergencyProfile.patientFullName, med.name, updated.stock));
    }

    showNotice('Dosis Confirmada', `Toma de ${med.name} registrada. Quedan ${updated.stock} comprimidos.`);
  };

  // Acción: Posponer toma (Snooze sin castigo)
  const handlePostponeDose = async (medId: string) => {
    if (doseActionBusy.current) return;
    const med = medicines.find((m) => m.id === medId);
    if (!med || dailySchedule.find(item => item.medicine.id === medId)?.isTakenToday) return;
    doseActionBusy.current = true;
    let reminder: string | null = null;
    try {
      reminder = await defaultNotificationService.scheduleSnoozeReminder(med, 15);
    } catch {
      // Keep the dose pending if scheduling fails.
    } finally {
      doseActionBusy.current = false;
    }
    if (!reminder) {
      showNotice('Recordatorio no programado', Platform.OS === 'web'
        ? 'Los avisos programados requieren la app de Android. La dosis sigue pendiente; configure una alarma en su teléfono.'
        : 'Habilite las notificaciones e intente nuevamente. La dosis sigue pendiente.');
      return;
    }

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medId,
      scheduledTime: getScheduledDate(scheduleTimes[medId] || '08:00', new Date()).toISOString(),
      status: 'postponed',
      registeredBy: activeRole,
      notes: 'Pospuesto 15 minutos por el paciente',
    };
    const newLogs = [newLog, ...logs];
    setLogs(newLogs);
    syncToCloud(undefined, newLogs);

    defaultHapticService.vibrateWarning();
    defaultSpeechService.speak(`Toma de ${med.name} pospuesta 15 minutos.`);
    showNotice('Dosis Pospuesta', `Le recordaremos tomar ${med.name} en 15 minutos.`);
  };

  // ==========================================
  // GESTIÓN DEL BOTIQUÍN: REPOSICIÓN Y EDICIÓN
  // ==========================================

  const handleOpenRestockModal = (med: Medicine) => {
    setRestockingMedicine(med);
    setIsRestockModalVisible(true);
  };

  const handleConfirmRestock = (medId: string, amount: number) => {
    if (!Number.isSafeInteger(amount) || amount <= 0) return;
    const newMeds = medicines.map((m) => (m.id === medId ? { ...m, stock: m.stock + amount } : m));
    setMedicines(newMeds);
    syncToCloud(newMeds);
    const target = medicines.find((m) => m.id === medId);
    const name = target ? target.name : 'medicamento';
    showNotice('Inventario Actualizado', `Se añadieron ${amount} unidades al stock de ${name}.`);
  };

  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setIsAddModalVisible(true);
  };

  const handleOpenEditModal = (med: Medicine) => {
    setEditingMedicine(med);
    setIsAddModalVisible(true);
  };

  const handleSaveMedicine = async (data: NewMedicineData) => {
    let savedMedicine: Medicine | undefined;
    if (data.id) {
      const newMeds = medicines.map((m) =>
        m.id === data.id
          ? {
              ...m,
              name: data.name,
              doseDescription: data.doseDescription,
              instructions: data.instructions,
              visualPill: {
                ...m.visualPill,
                shape: data.shape,
                colorHex: data.color.hex,
                colorName: data.color.name,
                photoUri: data.photoUri || m.visualPill.photoUri,
                imprint: data.imprint !== undefined ? data.imprint : m.visualPill.imprint,
                canSplit: data.canSplit !== undefined ? data.canSplit : m.visualPill.canSplit,
              },
              stock: data.stock,
              minStockAlert: data.minStockAlert,
            }
          : m
      );
      const newTimes = { ...scheduleTimes, [data.id!]: data.scheduleTime };
      setMedicines(newMeds);
      setScheduleTimes(newTimes);
      syncToCloud(newMeds, undefined, newTimes);
      savedMedicine = newMeds.find(m => m.id === data.id);
    } else {
      const newId = `med-${Date.now()}`;
      const newMed: Medicine = {
        id: newId,
        name: data.name,
        doseDescription: data.doseDescription,
        intervalHours: 24,
        instructions: data.instructions,
        visualPill: {
          shape: data.shape,
          colorHex: data.color.hex,
          colorName: data.color.name,
          photoUri: data.photoUri,
          imprint: data.imprint,
          canSplit: data.canSplit,
        },
        stock: data.stock,
        minStockAlert: data.minStockAlert,
        createdAt: new Date().toISOString(),
      };
      const newMeds = [...medicines, newMed];
      const newTimes = { ...scheduleTimes, [newId]: data.scheduleTime };
      setMedicines(newMeds);
      setScheduleTimes(newTimes);
      syncToCloud(newMeds, undefined, newTimes);
      savedMedicine = newMed;
      setExpandedMedId(newId);
    }

    setIsAddModalVisible(false);
    setEditingMedicine(null);
    if (savedMedicine) {
      let reminder: string | null = null;
      try { reminder = await defaultNotificationService.scheduleDoseReminder(savedMedicine, data.scheduleTime); } catch { /* Data is already saved locally. */ }
      showNotice('Medicamento guardado', reminder
        ? `${data.name}: aviso diario a las ${data.scheduleTime}.`
        : `${data.name} se guardó. ${Platform.OS === 'web' ? 'Los avisos programados requieren Android.' : 'Habilite las notificaciones para recibir avisos.'}`);
    }
  };

  // ==========================================
  // ELIMINACIÓN CON DIÁLOGO REAL Y FUNCIONAL
  // ==========================================

  const handleRequestDelete = (med: Medicine) => {
    setDeletingMedicine(med);
    setIsDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMedicine) return;
    const id = deletingMedicine.id;
    const name = deletingMedicine.name;
    try {
      await defaultNotificationService.cancelMedicineReminders(id);
    } catch {
      showNotice('No se pudo retirar', 'No se pudieron cancelar sus avisos. Intente nuevamente.');
      return;
    }

    const newMeds = medicines.filter((m) => m.id !== id);
    const newTimes = { ...scheduleTimes };
    delete newTimes[id];

    setMedicines(newMeds);
    setScheduleTimes(newTimes);
    syncToCloud(newMeds, undefined, newTimes);

    if (expandedMedId === id && newMeds.length > 0) {
      setExpandedMedId(newMeds[0].id);
    }

    setIsDeleteConfirmVisible(false);
    setDeletingMedicine(null);
    showNotice('Medicamento Retirado', `${name} fue retirado del pastillero familiar.`);
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmVisible(false);
    setDeletingMedicine(null);
  };

  // Acción: Llamada de auxilio ICE
  const handleCallEmergency = (phone: string, _contactName: string) => {
    CommunicationService.makePhoneCall(phone);
  };

  // Acción: Exportar reporte clínico hacia WhatsApp
  const handleExportReport = () => {
    if (!emergencyProfile.emergencyContact.phone) {
      showNotice('Falta el contacto', 'Agregue un teléfono en Ajustes para compartir el informe.');
      return;
    }
    const summary = generateClinicalSummary(
      medicines,
      logs,
      emergencyProfile
    );
    CommunicationService.openWhatsApp(
      emergencyProfile.emergencyContact.phone,
      summary.formattedReportText
    );
  };

  // Acción: Alerta Real WhatsApp a Cuidador
  const handleSimulateEscalationAlert = () => {
    if (!escalation.shouldEscalate) {
      showNotice('Sin tomas atrasadas', 'No hay una dosis pendiente que haya superado los 30 minutos de espera.');
      return;
    }
    const message = `AcompañaMed — ${emergencyProfile.patientFullName}\n${escalation.message}\nPor favor, revise el plan de hoy.`;
    CommunicationService.openWhatsApp(
      emergencyProfile.emergencyContact.phone,
      message
    );
  };

  // Acción: Llamada telefónica directa a la cuidadora
  const handleCallCaregiver = () => {
    if (!emergencyProfile.emergencyContact.phone) return;
    CommunicationService.makePhoneCall(emergencyProfile.emergencyContact.phone);
  };

  // Acciones de Enlace Familiar y Configuración
  const handleOpenFamilyPairing = () => {
    setIsFamilyPairingModalVisible(true);
  };

  const handleCloseFamilyPairing = () => {
    setIsFamilyPairingModalVisible(false);
  };

  const handleUpdateProfile = (updated: EmergencyProfile) => {
    setEmergencyProfile(updated);
    defaultStorageService.saveEmergencyProfile(updated);
    syncToCloud(undefined, undefined, undefined, updated);
  };

  const handleClearDemoData = () => {
    setMedicines([]);
    setScheduleTimes({});
    setLogs([]);
    setExpandedMedId('');
    defaultStorageService.saveMedicines([]);
    defaultStorageService.saveSchedules({});
    defaultStorageService.saveLogs([]);
    syncToCloud([], [], {});
    setIsFamilyPairingModalVisible(false);
    showNotice('Datos Vaciados', 'Se eliminaron los datos de prueba. Ahora puede registrar su propia receta médica real.');
  };

  const handleRestoreDemoData = () => {
    setMedicines(INITIAL_MEDICINES);
    setScheduleTimes(INITIAL_SCHEDULE_TIMES);
    setLogs(INITIAL_LOGS);
    setExpandedMedId(INITIAL_MEDICINES[0].id);
    defaultStorageService.saveMedicines(INITIAL_MEDICINES);
    defaultStorageService.saveSchedules(INITIAL_SCHEDULE_TIMES);
    defaultStorageService.saveLogs(INITIAL_LOGS);
    syncToCloud(INITIAL_MEDICINES, INITIAL_LOGS, INITIAL_SCHEDULE_TIMES);
    setIsFamilyPairingModalVisible(false);
    showNotice('Caso Demo Restaurado', 'Se cargaron los 3 medicamentos de prueba de Don Manuel.');
  };

  const handleFinishOnboarding = async (data: {
    role: ActorRole;
    startMode: 'empty' | 'demo' | 'pair';
    patientName: string;
    pairCode?: string;
  }) => {
    if (isOnboardingBusy) return;
    setIsOnboardingBusy(true);
    setOnboardingError('');
    try {
      if (data.startMode === 'pair') {
        const result = await handleConnectFamilyCode(data.pairCode || '', data.role);
        if (!result.success) {
          setOnboardingError(result.message);
          return;
        }
      } else {
        const demo = data.startMode === 'demo';
        const profile = demo ? { ...DEFAULT_PROFILE, patientFullName: data.patientName } : createEmptyProfile(data.patientName);
        const nextMeds = demo ? INITIAL_MEDICINES : [];
        const nextTimes = demo ? INITIAL_SCHEDULE_TIMES : {};
        const nextLogs = demo ? INITIAL_LOGS : [];
        const newCode = `MED-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        await Promise.all([
          defaultStorageService.saveEmergencyProfile(profile),
          defaultStorageService.saveMedicines(nextMeds),
          defaultStorageService.saveSchedules(nextTimes),
          defaultStorageService.saveLogs(nextLogs),
          defaultStorageService.saveFamilyCode(newCode),
        ]);
        setEmergencyProfile(profile);
        setMedicines(nextMeds);
        setScheduleTimes(nextTimes);
        setLogs(nextLogs);
        setExpandedMedId(nextMeds[0]?.id || '');
        setFamilyCode(newCode);
        setIsFamilyConnected(false);
      }
      await defaultStorageService.saveActiveRole(data.role);
      await defaultStorageService.saveOnboardingCompleted(true);
      setActiveRole(data.role);
      setIsOnboardingVisible(false);
    } catch {
      setOnboardingError('No se pudo guardar. Intente nuevamente. La configuración todavía no está completa.');
    } finally {
      setIsOnboardingBusy(false);
    }
  };

  const handleTestNotification = async () => {
    const success = await defaultNotificationService.triggerImmediateTestNotification(
      'AcompañaMed: prueba de notificación',
      'Este es un aviso de prueba. No indica que deba tomar un medicamento.'
    );
    if (success) {
      showNotice('Notificación Emitida', 'Se disparó una notificación con sonido en su dispositivo/navegador.');
    } else {
      showNotice('Permiso de Notificación', 'Por favor habilite los permisos de notificaciones en su navegador o teléfono.');
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.desktopOuterCanvas}>
        <View style={[styles.appShellFrame, styles.centerContent, { paddingTop: topInset }]}>
          <StatusBar style="dark" />
          <MaterialCommunityIcons name="pill" size={48} color="#0F172A" />
          <Text style={styles.loadingTitle}>AcompañaMed</Text>
          <Text style={styles.loadingSubtitle}>Cargando plan de medicación...</Text>
          <ActivityIndicator size="small" color="#0F172A" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  const isSplitModeActive = isDesktop && desktopLayoutMode === 'desktop_split';

  return (
    <View style={styles.desktopOuterCanvas}>
      <StatusBar style="dark" />

      {/* CONTENEDOR ADAPTATIVO ERGONÓMICO */}
      <View
        style={[
          styles.appShellFrame,
          isLargeScreen && styles.appShellFrameLarge,
          isSplitModeActive && styles.appShellFrameSplit,
        ]}
      >
        {/* CABECERA MINIMALISTA HOSPITALARIA */}
        <View style={[styles.topAppHeader, { paddingTop: isDesktop ? 12 : topInset + 6 }]}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.appNameLabel}>AcompañaMed</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <MaterialCommunityIcons
                name={activeRole === 'patient' ? 'account-heart' : 'shield-account'}
                size={14}
                color={activeRole === 'patient' ? '#0284C7' : '#059669'}
              />
              <Text style={styles.patientSubLabel}>
                {activeRole === 'patient'
                  ? `Modo Paciente (${emergencyProfile.patientFullName})`
                  : `Modo Cuidador · ${emergencyProfile.patientFullName || 'Configure el perfil'}`}
              </Text>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#94A3B8' }} />
              <MaterialCommunityIcons name={isFamilyConnected && lastCloudSyncTime ? 'cloud-check' : 'cellphone'} size={12} color="#475569" />
              <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>
                {isFamilyConnected && lastCloudSyncTime ? 'Enlace activo' : 'Guardado en este teléfono'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Selector de Modo en Desktop */}
            {isDesktop && (
              <View style={styles.desktopModeSelector}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    desktopLayoutMode === 'mobile_shell' && styles.modeButtonActive,
                  ]}
                  onPress={() => setDesktopLayoutMode('mobile_shell')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="cellphone"
                    size={14}
                    color={desktopLayoutMode === 'mobile_shell' ? '#0F172A' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      desktopLayoutMode === 'mobile_shell' && styles.modeButtonTextActive,
                    ]}
                  >
                    Móvil
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    desktopLayoutMode === 'desktop_split' && styles.modeButtonActive,
                  ]}
                  onPress={() => setDesktopLayoutMode('desktop_split')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="monitor-dashboard"
                    size={14}
                    color={desktopLayoutMode === 'desktop_split' ? '#0F172A' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      desktopLayoutMode === 'desktop_split' && styles.modeButtonTextActive,
                    ]}
                  >
                    PC Split
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botón Ajustes / Perfil */}
            <TouchableOpacity
              style={styles.btnHeaderSettings}
              onPress={handleOpenFamilyPairing}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Configuración, cambio de rol y ajustes"
            >
              <MaterialCommunityIcons name="cog-outline" size={16} color="#0F172A" />
              <Text style={styles.btnHeaderSettingsText}>Ajustes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CUERPO PRINCIPAL */}
        {isSplitModeActive ? (
          /* ============================================================== */
          /* MODO ESCRITORIO PROFESIONAL: 2 COLUMNAS SIN ELEMENTOS ESTIRADOS */
          /* ============================================================== */
          <View style={styles.splitDesktopContainer}>
            {/* Columna Izquierda: Plan del Día para el Paciente */}
            <View style={styles.splitLeftColumn}>
              <View style={styles.columnHeaderTitleRow}>
                <MaterialCommunityIcons name="pill" size={18} color="#0F172A" />
                <Text style={styles.columnHeaderTitleText}>Plan Cronológico de Hoy</Text>
              </View>
              <TodayTimelineStream
                dailySchedule={dailySchedule}
                expandedMedId={expandedMedId}
                onToggleExpand={(id) => setExpandedMedId((prev) => (prev === id ? '' : id))}
                onTakeDose={(id) => handleTakeDose(id, 'patient')}
                onPostponeDose={handlePostponeDose}
                adherencePercentage={dailyProgress}
                onOpenAddMedicine={handleOpenAddModal}
                onInspectMedicine={(med) => setInspectingMedicine(med)}
              />
            </View>

            {/* Separador Vertical */}
            <View style={styles.splitVerticalDivider} />

            {/* Columna Derecha: Panel del Cuidador / Botiquín / Emergencia */}
            <View style={styles.splitRightColumn}>
              {(() => {
                const effectiveRightTab = activeTab === 'today' ? 'caregiver' : activeTab;
                return (
                  <>
                    <View style={styles.splitSubTabsHeader}>
                      <TouchableOpacity
                        style={[
                          styles.splitSubTabItem,
                          effectiveRightTab === 'caregiver' && styles.splitSubTabItemActive,
                        ]}
                        onPress={() => setActiveTab('caregiver')}
                      >
                        <MaterialCommunityIcons
                          name="chart-timeline-variant"
                          size={16}
                          color={effectiveRightTab === 'caregiver' ? '#0F172A' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.splitSubTabLabel,
                            effectiveRightTab === 'caregiver' && styles.splitSubTabLabelActive,
                          ]}
                        >
                          Cuidador
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.splitSubTabItem,
                          effectiveRightTab === 'stock' && styles.splitSubTabItemActive,
                        ]}
                        onPress={() => setActiveTab('stock')}
                      >
                        <MaterialCommunityIcons
                          name="medical-bag"
                          size={16}
                          color={effectiveRightTab === 'stock' ? '#0F172A' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.splitSubTabLabel,
                            effectiveRightTab === 'stock' && styles.splitSubTabLabelActive,
                          ]}
                        >
                          Botiquín
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.splitSubTabItem,
                          effectiveRightTab === 'emergency' && styles.splitSubTabItemActive,
                        ]}
                        onPress={() => setActiveTab('emergency')}
                      >
                        <MaterialCommunityIcons
                          name="shield-alert-outline"
                          size={16}
                          color={effectiveRightTab === 'emergency' ? '#0F172A' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.splitSubTabLabel,
                            effectiveRightTab === 'emergency' && styles.splitSubTabLabelActive,
                          ]}
                        >
                          Emergencia
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                      {effectiveRightTab === 'caregiver' && (
                        <CaregiverDashboard
                          contact={emergencyProfile.emergencyContact}
                          escalation={escalation}
                          adherence={adherence}
                          clinicalReport={clinicalReport}
                          onOpenReport={() => setIsReportModalVisible(true)}
                          onSimulateEscalationAlert={handleSimulateEscalationAlert}
                          onCallCaregiver={handleCallCaregiver}
                          onOpenFamilyPairing={handleOpenFamilyPairing}
                          onTestNotification={handleTestNotification}
                        />
                      )}
                      {effectiveRightTab === 'stock' && (
                        activeRole === 'patient' ? (
                          <View style={styles.protectedRoleContainer}>
                            <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#0284C7" />
                            <Text style={styles.protectedRoleTitle}>Área Protegida de la Cuidadora</Text>
                            <Text style={styles.protectedRoleSubtitle}>
                              Cambie al modo Cuidador para gestionar el botiquín y evitar cambios accidentales en la receta.
                            </Text>
                            <TouchableOpacity
                              style={styles.btnUnlockRole}
                              onPress={() => setActiveRole('caregiver')}
                            >
                              <MaterialCommunityIcons name="shield-check" size={16} color="#FFFFFF" />
                              <Text style={styles.btnUnlockRoleText}>Desbloquear como Cuidadora</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <MedicineInventoryPanel
                            medicines={medicines}
                            scheduleTimes={scheduleTimes}
                            onOpenRestock={handleOpenRestockModal}
                            onRequestDelete={handleRequestDelete}
                            onEdit={handleOpenEditModal}
                            onOpenAddModal={handleOpenAddModal}
                            onInspect={(med) => setInspectingMedicine(med)}
                          />
                        )
                      )}
                      {effectiveRightTab === 'emergency' && (
                        <EmergencyProfileCard
                          emergencyProfile={emergencyProfile}
                          onCallEmergency={handleCallEmergency}
                          onOpenFamilyPairing={handleOpenFamilyPairing}
                        />
                      )}
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        ) : (
          /* ============================================================== */
          /* MODO MÓVIL ERGONÓMICO (1 COLUMNA CON CHASSIS CENTRADO EN PC)   */
          /* ============================================================== */
          <View style={styles.mainContainer}>
            {activeTab === 'today' && (
              <TodayTimelineStream
                dailySchedule={dailySchedule}
                expandedMedId={expandedMedId}
                onToggleExpand={(id) => setExpandedMedId((prev) => (prev === id ? '' : id))}
                onTakeDose={(id) => handleTakeDose(id, 'patient')}
                onPostponeDose={handlePostponeDose}
                adherencePercentage={dailyProgress}
                onOpenAddMedicine={handleOpenAddModal}
                onInspectMedicine={(med) => setInspectingMedicine(med)}
              />
            )}

            {activeTab === 'caregiver' && (
              <CaregiverDashboard
                contact={emergencyProfile.emergencyContact}
                escalation={escalation}
                adherence={adherence}
                clinicalReport={clinicalReport}
                onOpenReport={() => setIsReportModalVisible(true)}
                onSimulateEscalationAlert={handleSimulateEscalationAlert}
                onCallCaregiver={handleCallCaregiver}
                onOpenFamilyPairing={handleOpenFamilyPairing}
                onTestNotification={handleTestNotification}
              />
            )}

            {activeTab === 'stock' && (
              activeRole === 'patient' ? (
                <View style={styles.protectedRoleContainer}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#0284C7" />
                  <Text style={styles.protectedRoleTitle}>Área Protegida de la Cuidadora</Text>
                  <Text style={styles.protectedRoleSubtitle}>
                    Cambie al modo Cuidador para gestionar el botiquín y evitar cambios accidentales en la receta.
                  </Text>
                  <TouchableOpacity
                    style={styles.btnUnlockRole}
                    onPress={() => setActiveRole('caregiver')}
                  >
                    <MaterialCommunityIcons name="shield-check" size={16} color="#FFFFFF" />
                    <Text style={styles.btnUnlockRoleText}>Desbloquear como Cuidadora</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <MedicineInventoryPanel
                  medicines={medicines}
                  scheduleTimes={scheduleTimes}
                  onOpenRestock={handleOpenRestockModal}
                  onRequestDelete={handleRequestDelete}
                  onEdit={handleOpenEditModal}
                  onOpenAddModal={handleOpenAddModal}
                  onInspect={(med) => setInspectingMedicine(med)}
                />
              )
            )}

            {activeTab === 'emergency' && (
              <EmergencyProfileCard
                emergencyProfile={emergencyProfile}
                onCallEmergency={handleCallEmergency}
                onOpenFamilyPairing={handleOpenFamilyPairing}
              />
            )}

            {/* Barra de Navegación Inferior (Contenida en el Chasis Móvil) */}
            <BottomNavBar activeTab={activeTab} onSelectTab={setActiveTab} />
          </View>
        )}
      </View>

      {/* MODAL 1: REGISTRAR / EDITAR MEDICAMENTO (NUNCA ESTIRADO) */}
      <AddMedicineModal
        visible={isAddModalVisible}
        initialMedicine={editingMedicine}
        initialScheduleTime={editingMedicine ? scheduleTimes[editingMedicine.id] : '08:00'}
        onClose={() => {
          setIsAddModalVisible(false);
          setEditingMedicine(null);
        }}
        onSave={handleSaveMedicine}
      />

      {/* MODAL 2: INFORME CLÍNICO FORMAL EXPORTABLE */}
      <ClinicalReportModal
        visible={isReportModalVisible}
        reportText={clinicalReport.formattedReportText}
        onClose={() => setIsReportModalVisible(false)}
        onExport={handleExportReport}
      />

      {/* MODAL 3: REPOSICIÓN INTELIGENTE DE BOTIQUÍN */}
      <RestockModal
        visible={isRestockModalVisible}
        medicine={restockingMedicine}
        onClose={() => {
          setIsRestockModalVisible(false);
          setRestockingMedicine(null);
        }}
        onConfirmRestock={handleConfirmRestock}
      />

      {/* MODAL 4: DIÁLOGO DE CONFIRMACIÓN REAL DE RETIRO DE FÁRMACO */}
      <ConfirmDialogModal
        visible={isDeleteConfirmVisible}
        title="Retirar del Pastillero Familiar"
        message={`¿Desea desvincular ${deletingMedicine?.name || 'este medicamento'} (${deletingMedicine?.doseDescription || ''})? Se conservará su historial médico de tomas anteriores.`}
        confirmText="Sí, retirar"
        cancelText="Cancelar"
        isDestructive={true}
        iconName="trash-can-outline"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* MODAL 5: ENLACE FAMILIAR, PERFIL REAL Y GESTIÓN DE DATOS */}
      <FamilyPairingModal
        visible={isFamilyPairingModalVisible}
        onClose={handleCloseFamilyPairing}
        emergencyProfile={emergencyProfile}
        onUpdateProfile={handleUpdateProfile}
        onClearDemoData={handleClearDemoData}
        onRestoreDemoData={handleRestoreDemoData}
        onTestNotification={handleTestNotification}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        familyCode={familyCode}
        onConnectFamilyCode={handleConnectFamilyCode}
        isSyncing={isCloudSyncing}
        lastSyncTime={lastCloudSyncTime}
        currentDeviceId={deviceId}
        onRevokeDevice={handleRevokeDevice}
      />

      {/* MODAL 6: LUPA DE INSPECCIÓN Y VERIFICACIÓN FOTOGRÁFICA DE BLÍSTER */}
      <PillInspectionModal
        visible={!!inspectingMedicine}
        medicine={inspectingMedicine}
        onClose={() => setInspectingMedicine(null)}
        onUpdatePhoto={handleUpdateMedicinePhoto}
      />

      {/* MODAL 7: BIENVENIDA Y CONFIGURACIÓN INICIAL (ONBOARDING) */}
      <OnboardingModal
        visible={isOnboardingVisible}
        busy={isOnboardingBusy}
        error={onboardingError}
        onFinishOnboarding={handleFinishOnboarding}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // CANVAS EXTERIOR DE ESCRITORIO
  desktopOuterCanvas: {
    flex: 1,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CHASIS DE LA APLICACIÓN (RESPONSIVE SHELL)
  appShellFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F8FAFC',
  },
  appShellFrameLarge: {
    maxWidth: 480,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  appShellFrameSplit: {
    maxWidth: 1040,
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },

  // CABECERA SUPERIOR
  topAppHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitleGroup: {
    gap: 2,
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  appNameLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  patientSubLabel: {
    fontSize: 11,
    color: '#64748B',
  },

  // Selector de Rol Activo (Paciente vs Cuidador)
  roleSelectorPill: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  roleOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    gap: 3,
  },
  roleOptionBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  roleOptionText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  roleOptionTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // Selector de Modo Desktop
  desktopModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modeButtonText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  btnHeaderSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnHeaderSettingsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  clockHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clockHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },

  mainContainer: {
    flex: 1,
  },

  // PROTECCIÓN DE ROL: PANTALLA DE ACCESO RESTRINGIDO
  protectedRoleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  protectedRoleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  protectedRoleSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 360,
  },
  btnUnlockRole: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 6,
    gap: 6,
    marginTop: 6,
  },
  btnUnlockRoleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ESTRUCTURA SPLIT DE 2 COLUMNAS PARA ESCRITORIO
  splitDesktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  splitLeftColumn: {
    flex: 5.5,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  columnHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  columnHeaderTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  splitVerticalDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  splitRightColumn: {
    flex: 4.5,
    backgroundColor: '#FFFFFF',
  },
  splitSubTabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 6,
    gap: 6,
  },
  splitSubTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  splitSubTabItemActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  splitSubTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  splitSubTabLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
});
