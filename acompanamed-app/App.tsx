import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
  NewMedicineData,
} from './src/components';

// Catálogo inicial con polifarmacia geriátrica real
const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-losartan',
    name: 'Losartán Potásico',
    doseDescription: '50 mg',
    intervalHours: 24,
    instructions: 'Tomar con medio vaso de agua después del desayuno.',
    visualPill: { shape: 'round', colorHex: '#0284C7', colorName: 'Azul Clínico' },
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
    visualPill: { shape: 'capsule', colorHex: '#E2E8F0', colorName: 'Blanco / Nácar' },
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
    visualPill: { shape: 'oval', colorHex: '#D97706', colorName: 'Ámbar Cálido' },
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

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<AppNavTab>('today');
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>(INITIAL_SCHEDULE_TIMES);
  const [logs, setLogs] = useState<DoseLog[]>(INITIAL_LOGS);
  const [emergencyProfile, setEmergencyProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE);
  const [expandedMedId, setExpandedMedId] = useState<string>('med-losartan');

  // Modales
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  // Carga asíncrona de almacenamiento
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedMeds = await defaultStorageService.loadMedicines(INITIAL_MEDICINES);
        const storedTimes = await defaultStorageService.loadSchedules(INITIAL_SCHEDULE_TIMES);
        const storedLogs = await defaultStorageService.loadLogs(INITIAL_LOGS);
        const storedProfile = await defaultStorageService.loadEmergencyProfile(DEFAULT_PROFILE);

        setMedicines(storedMeds);
        setScheduleTimes(storedTimes);
        setLogs(storedLogs);
        setEmergencyProfile(storedProfile);
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

  // Cálculos de Dominio
  const dailySchedule = buildDailySchedule(medicines, scheduleTimes, logs, new Date());
  const adherence = calculateAdherence(logs);
  const clinicalReport = generateClinicalSummary(medicines, logs, emergencyProfile);

  // Escalamiento simulado (40 min desde las 08:00)
  const simulatedScheduledTime = new Date('2026-10-29T08:00:00.000Z');
  const simulatedNowTime = new Date('2026-10-29T08:40:00.000Z');
  const escalation = evaluateEscalation(simulatedScheduledTime, simulatedNowTime, 30);

  // Acción: Confirmar toma de pastilla
  const handleTakeDose = (medId: string, actor: ActorRole = 'patient') => {
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
      registeredBy: 'patient',
      notes: 'Pospuesto 15 minutos por el paciente',
    };
    setLogs((prev) => [newLog, ...prev]);

    defaultHapticService.vibrateWarning();
    defaultSpeechService.speak(`Toma de ${med.name} pospuesta 15 minutos.`);
    Alert.alert('Dosis Pospuesta', `Le recordaremos tomar ${med.name} en 15 minutos.`);
  };

  // Acción: Reponer stock (+30 unidades)
  const handleRestockMedicine = (medId: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, stock: m.stock + 30 } : m))
    );
    Alert.alert('Inventario Actualizado', 'Se añadieron 30 unidades al stock.');
  };

  // Acción: Eliminar fármaco
  const handleDeleteMedicine = (medId: string, name: string) => {
    Alert.alert(
      'Retirar Medicamento',
      `¿Desea desvincular ${name} del pastillero familiar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar',
          style: 'destructive',
          onPress: () => {
            setMedicines((prev) => prev.filter((m) => m.id !== medId));
            if (expandedMedId === medId && medicines.length > 1) {
              const other = medicines.find((m) => m.id !== medId);
              if (other) setExpandedMedId(other.id);
            }
          },
        },
      ]
    );
  };

  // Acción: Guardar nuevo medicamento desde modal
  const handleSaveNewMedicine = (data: NewMedicineData) => {
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
      },
      stock: data.stock,
      minStockAlert: data.minStockAlert,
      createdAt: new Date().toISOString(),
    };

    setMedicines((prev) => [...prev, newMed]);
    setScheduleTimes((prev) => ({ ...prev, [newId]: data.scheduleTime }));

    defaultNotificationService.scheduleDoseReminder(newMed, data.scheduleTime);
    Alert.alert('Medicamento Guardado', `${newMed.name} ha sido incorporado al pastillero.`);
  };

  // Acción: Llamada de auxilio ICE
  const handleCallEmergency = (phone: string, contactName: string) => {
    Alert.alert('Llamada de Emergencia', `Conectando con contacto de auxilio (${contactName}): ${phone}`);
  };

  // Acción: Exportar reporte clínico
  const handleExportReport = () => {
    Alert.alert(
      'Informe Exportado',
      'El reporte de adherencia fue copiado al portapapeles y está listo para WhatsApp o impresión médica.'
    );
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={[styles.safeContainer, styles.centerContent]}>
        <StatusBar style="dark" />
        <MaterialCommunityIcons name="pill" size={48} color="#0F172A" />
        <Text style={styles.loadingTitle}>AcompañaMed</Text>
        <Text style={styles.loadingSubtitle}>Cargando plan de medicación...</Text>
        <ActivityIndicator size="small" color="#0F172A" style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" />

      {/* CABECERA MINIMALISTA HOSPITALARIA */}
      <View style={styles.topAppHeader}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.appNameLabel}>AcompañaMed</Text>
          <Text style={styles.patientSubLabel}>
            Paciente: <Text style={{ fontWeight: '700', color: '#0F172A' }}>Don Manuel (82 años)</Text>
          </Text>
        </View>

        <View
          style={styles.clockHeaderBadge}
          accessibilityRole="text"
          accessibilityLabel={`Hora actual: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        >
          <MaterialCommunityIcons name="clock-outline" size={14} color="#0F172A" />
          <Text style={styles.clockHeaderText}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {/* CUERPO PRINCIPAL */}
      <View style={styles.mainContainer}>
        {activeTab === 'today' && (
          <TodayTimelineStream
            dailySchedule={dailySchedule}
            expandedMedId={expandedMedId}
            onToggleExpand={(id) => setExpandedMedId((prev) => (prev === id ? '' : id))}
            onTakeDose={(id) => handleTakeDose(id, 'patient')}
            onPostponeDose={handlePostponeDose}
            adherencePercentage={adherence.adherencePercentage}
          />
        )}

        {activeTab === 'caregiver' && (
          <CaregiverDashboard
            escalation={escalation}
            adherence={adherence}
            clinicalReport={clinicalReport}
            onOpenReport={() => setIsReportModalVisible(true)}
          />
        )}

        {activeTab === 'stock' && (
          <MedicineInventoryPanel
            medicines={medicines}
            scheduleTimes={scheduleTimes}
            onRestock={handleRestockMedicine}
            onDelete={handleDeleteMedicine}
            onOpenAddModal={() => setIsAddModalVisible(true)}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyProfileCard
            emergencyProfile={emergencyProfile}
            onCallEmergency={handleCallEmergency}
          />
        )}
      </View>

      {/* BARRA DE NAVEGACIÓN INFERIOR NATIVA */}
      <BottomNavBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* MODAL: REGISTRAR NUEVO MEDICAMENTO */}
      <AddMedicineModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={handleSaveNewMedicine}
      />

      {/* MODAL: INFORME CLÍNICO FORMAL EXPORTABLE */}
      <ClinicalReportModal
        visible={isReportModalVisible}
        reportText={clinicalReport.formattedReportText}
        onClose={() => setIsReportModalVisible(false)}
        onExport={handleExportReport}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  topAppHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 12,
    color: '#334155',
  },
  clockHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clockHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  mainContainer: {
    flex: 1,
  },
});
