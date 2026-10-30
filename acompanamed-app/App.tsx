import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
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

  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>(INITIAL_SCHEDULE_TIMES);
  const [logs, setLogs] = useState<DoseLog[]>(INITIAL_LOGS);
  const [emergencyProfile, setEmergencyProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE);
  const [expandedMedId, setExpandedMedId] = useState<string>('med-losartan');

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
        const storedMeds = await defaultStorageService.loadMedicines(INITIAL_MEDICINES);
        const storedTimes = await defaultStorageService.loadSchedules(INITIAL_SCHEDULE_TIMES);
        const storedLogs = await defaultStorageService.loadLogs(INITIAL_LOGS);
        const storedProfile = await defaultStorageService.loadEmergencyProfile(DEFAULT_PROFILE);
        const storedRole = await defaultStorageService.loadActiveRole('caregiver');

        setMedicines(storedMeds);
        setScheduleTimes(storedTimes);
        setLogs(storedLogs);
        setEmergencyProfile(storedProfile);
        setActiveRole(storedRole);

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
  const dailySchedule = buildDailySchedule(medicines, scheduleTimes, logs, new Date());
  const adherence = calculateAdherence(logs);
  const clinicalReport = generateClinicalSummary(medicines, logs, emergencyProfile);

  // Escalamiento simulado (40 min desde las 08:00)
  const simulatedScheduledTime = new Date('2026-10-29T08:00:00.000Z');
  const simulatedNowTime = new Date('2026-10-29T08:40:00.000Z');
  const escalation = evaluateEscalation(simulatedScheduledTime, simulatedNowTime, 30);

  // Acción: Confirmar toma de pastilla
  const handleTakeDose = (medId: string, actor: ActorRole = activeRole) => {
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;

    const check = canRegisterDose(medId, logs, new Date());
    if (!check.allowed) {
      Alert.alert('Protección de Seguridad Médica', check.reason);
      return;
    }

    const updated = decrementStock(med, 1);
    setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medId,
      scheduledTime: new Date().toISOString(),
      takenTime: new Date().toISOString(),
      status: 'taken',
      registeredBy: actor,
    };
    setLogs((prev) => [newLog, ...prev]);

    if (actor === 'patient') {
      defaultHapticService.vibrateSuccess();
      defaultSpeechService.speak(formatConfirmationSpeech('Don Manuel', med.name, updated.stock));
    }

    Alert.alert('Dosis Confirmada', `Toma de ${med.name} registrada. Quedan ${updated.stock} comprimidos.`);
  };

  // Acción: Posponer toma (Snooze sin castigo)
  const handlePostponeDose = (medId: string) => {
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medId,
      scheduledTime: new Date().toISOString(),
      status: 'postponed',
      registeredBy: activeRole,
      notes: 'Pospuesto 15 minutos por el paciente',
    };
    setLogs((prev) => [newLog, ...prev]);

    defaultHapticService.vibrateWarning();
    defaultSpeechService.speak(`Toma de ${med.name} pospuesta 15 minutos.`);
    Alert.alert('Dosis Pospuesta', `Le recordaremos tomar ${med.name} en 15 minutos.`);
  };

  // ==========================================
  // GESTIÓN DEL BOTIQUÍN: REPOSICIÓN Y EDICIÓN
  // ==========================================

  const handleOpenRestockModal = (med: Medicine) => {
    setRestockingMedicine(med);
    setIsRestockModalVisible(true);
  };

  const handleConfirmRestock = (medId: string, amount: number) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, stock: m.stock + amount } : m))
    );
    const target = medicines.find((m) => m.id === medId);
    const name = target ? target.name : 'medicamento';
    Alert.alert('Inventario Actualizado', `Se añadieron ${amount} unidades al stock de ${name}.`);
  };

  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setIsAddModalVisible(true);
  };

  const handleOpenEditModal = (med: Medicine) => {
    setEditingMedicine(med);
    setIsAddModalVisible(true);
  };

  const handleSaveMedicine = (data: NewMedicineData) => {
    if (data.id) {
      setMedicines((prev) =>
        prev.map((m) =>
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
        )
      );
      setScheduleTimes((prev) => ({ ...prev, [data.id!]: data.scheduleTime }));
      Alert.alert('Prescripción Actualizada', `Los cambios para ${data.name} fueron guardados.`);
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
      setMedicines((prev) => [...prev, newMed]);
      setScheduleTimes((prev) => ({ ...prev, [newId]: data.scheduleTime }));
      defaultNotificationService.scheduleDoseReminder(newMed, data.scheduleTime);
      Alert.alert('Medicamento Guardado', `${newMed.name} ha sido incorporado al pastillero.`);
    }

    setIsAddModalVisible(false);
    setEditingMedicine(null);
  };

  // ==========================================
  // ELIMINACIÓN CON DIÁLOGO REAL Y FUNCIONAL
  // ==========================================

  const handleRequestDelete = (med: Medicine) => {
    setDeletingMedicine(med);
    setIsDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingMedicine) return;
    const id = deletingMedicine.id;
    const name = deletingMedicine.name;

    setMedicines((prev) => prev.filter((m) => m.id !== id));
    setScheduleTimes((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    if (expandedMedId === id && medicines.length > 1) {
      const other = medicines.find((m) => m.id !== id);
      if (other) setExpandedMedId(other.id);
    }

    setIsDeleteConfirmVisible(false);
    setDeletingMedicine(null);
    Alert.alert('Medicamento Retirado', `${name} fue retirado del pastillero familiar.`);
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
    const message = `⚠️ ALERTA MÉDICA ACOMPAÑAMED:\n${emergencyProfile.patientFullName} (${emergencyProfile.age} años) no ha confirmado su toma tras 30 minutos de gracia.\n\nPor favor comuníquese de inmediato.`;
    CommunicationService.openWhatsApp(
      emergencyProfile.emergencyContact.phone,
      message
    );
  };

  // Acción: Llamada telefónica directa a la cuidadora
  const handleCallCaregiver = () => {
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
  };

  const handleClearDemoData = () => {
    setMedicines([]);
    setScheduleTimes({});
    setLogs([]);
    setExpandedMedId('');
    defaultStorageService.saveMedicines([]);
    defaultStorageService.saveSchedules({});
    defaultStorageService.saveLogs([]);
    setIsFamilyPairingModalVisible(false);
    Alert.alert('Datos Vaciados', 'Se eliminaron los datos de prueba. Ahora puede registrar su propia receta médica real.');
  };

  const handleRestoreDemoData = () => {
    setMedicines(INITIAL_MEDICINES);
    setScheduleTimes(INITIAL_SCHEDULE_TIMES);
    setLogs(INITIAL_LOGS);
    setExpandedMedId(INITIAL_MEDICINES[0].id);
    defaultStorageService.saveMedicines(INITIAL_MEDICINES);
    defaultStorageService.saveSchedules(INITIAL_SCHEDULE_TIMES);
    defaultStorageService.saveLogs(INITIAL_LOGS);
    setIsFamilyPairingModalVisible(false);
    Alert.alert('Caso Demo Restaurado', 'Se cargaron los 3 medicamentos de prueba de Don Manuel.');
  };

  const handleFinishOnboarding = async (data: {
    role: ActorRole;
    startMode: 'empty' | 'demo';
    patientName: string;
  }) => {
    setActiveRole(data.role);
    await defaultStorageService.saveActiveRole(data.role);
    await defaultStorageService.saveOnboardingCompleted(true);

    const updatedProfile: EmergencyProfile = {
      ...emergencyProfile,
      patientFullName: data.patientName,
    };
    setEmergencyProfile(updatedProfile);
    await defaultStorageService.saveEmergencyProfile(updatedProfile);

    if (data.startMode === 'empty') {
      setMedicines([]);
      setScheduleTimes({});
      setLogs([]);
      setExpandedMedId('');
      await defaultStorageService.saveMedicines([]);
      await defaultStorageService.saveSchedules({});
      await defaultStorageService.saveLogs([]);
    } else {
      setMedicines(INITIAL_MEDICINES);
      setScheduleTimes(INITIAL_SCHEDULE_TIMES);
      setLogs(INITIAL_LOGS);
      setExpandedMedId(INITIAL_MEDICINES[0].id);
      await defaultStorageService.saveMedicines(INITIAL_MEDICINES);
      await defaultStorageService.saveSchedules(INITIAL_SCHEDULE_TIMES);
      await defaultStorageService.saveLogs(INITIAL_LOGS);
    }

    setIsOnboardingVisible(false);
  };

  const handleTestNotification = async () => {
    const success = await defaultNotificationService.triggerImmediateTestNotification(
      '🔔 AcompañaMed: ¡Alarma de Dosis Activa!',
      `${emergencyProfile.patientFullName}: Es momento de tomar Losartán Potásico (50 mg) con medio vaso de agua.`
    );
    if (success) {
      Alert.alert('Notificación Emitida', 'Se disparó una notificación con sonido en su dispositivo/navegador.');
    } else {
      Alert.alert('Permiso de Notificación', 'Por favor habilite los permisos de notificaciones en su navegador o teléfono.');
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <MaterialCommunityIcons
                name={activeRole === 'patient' ? 'account-heart' : 'shield-account'}
                size={14}
                color={activeRole === 'patient' ? '#0284C7' : '#059669'}
              />
              <Text style={styles.patientSubLabel}>
                {activeRole === 'patient'
                  ? `Modo Paciente (${emergencyProfile.patientFullName})`
                  : `Modo Cuidadora (${emergencyProfile.emergencyContact.name})`}
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
                adherencePercentage={adherence.adherencePercentage}
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
                              El Botiquín y la edición de recetas están restringidos para María Alhua para evitar alteraciones accidentales en el tratamiento de Don Manuel.
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
                adherencePercentage={adherence.adherencePercentage}
                onOpenAddMedicine={handleOpenAddModal}
                onInspectMedicine={(med) => setInspectingMedicine(med)}
              />
            )}

            {activeTab === 'caregiver' && (
              <CaregiverDashboard
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
                    El Botiquín y la edición de recetas están restringidos para María Alhua para evitar alteraciones accidentales en el tratamiento de Don Manuel.
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
